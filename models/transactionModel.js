import pool from "../db/db.js";

export const saveSecretKeyToDB = async (key) => {
  await pool.query('UPDATE api_keys SET secret_key = $1 WHERE service_name = $2', [key, 'mypvit']);
};


export const getSecretKeyFromDB = async () => {
  try {
    const result = await pool.query('SELECT secret_key FROM api_keys WHERE service_name = $1', ['mypvit']);
    return result.rows[0]?.secret_key || null;
  } catch (error) {
    console.error('Error fetching secret key from database:', error);
    throw new Error('Failed to retrieve secret key');
  }
};


export const createTransactions = async (transactionData) => {
  const {
    user_id,
    request_id,
    amount
  } = transactionData;

  const query = `
    INSERT INTO transactions 
    (user_id, request_id, amount, status)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const values = [
    user_id,
    request_id,
    amount,
    'pending'
  ];


  const result = await pool.query(query, values);
  console.log(result.rows[0])
  return result.rows[0];
};


export const updateTransactionAndRequestStatus = async (transactionId, status) => {
  try {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      console.log('*******'+ transactionId + '*********');

      // Mettre à jour le statut de la transaction
      await client.query(
        `UPDATE transactions SET status = $1 WHERE request_id = $2`,
        [status, transactionId]
      );

      // Récupérer la requête liée à la transaction
      const requestResult = await client.query(
        `SELECT request_id FROM transactions WHERE request_id = $1`,
        [transactionId]
      );

      const requestId = requestResult.rows[0]?.request_id;
      if (!requestId) {
        throw new Error("Requête associée introuvable.");
      }

      // Mettre à jour le statut de la requête
      const requestStatus = status === "SUCCESS" ? "WAITING" : "UNPAID";
      await client.query(
        `UPDATE requests SET status = $1 WHERE id = $2`,
        [requestStatus, requestId]
      );

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour des statuts :", error.message);
    throw error;
  }
};


