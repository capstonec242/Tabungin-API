import { createRequire } from "module";
const require = createRequire(import.meta.url);
const serviceAccount = require("../../tabungin-app-242208-firebase-adminsdk-j0xfn-c0d66c395d.json");
import admin from "firebase-admin";

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

export const authenticate = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).send({ error: "Unauthorized: Token is required." });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        if (!decodedToken || !decodedToken.uid) {
            return res.status(403).send({ error: "Invalid token." });
        }
        req.authUser = {
            uid: decodedToken.uid,
            email: decodedToken.email,
        };
        next();
    } catch (error) {
        console.error("Invalid token: ", error.message);
        res.status(403).send({ error: "Invalid token." });
    }
};
