import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuth = async (req, res) => {
  const { idToken } = req.body;

  try {
    if (idToken) {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      const userId = payload["sub"];
      const email = payload["email"];

      return res.status(200).json({ email, userId });
    } else {
      return res.status(401).json({
        message: "Invalid or expired token.",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Database Error",
    });
  }
};
