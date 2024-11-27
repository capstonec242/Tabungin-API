export const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).send({ error: "Unauthorized: Token is required." });
    }

    try {
        next();
    } catch (error) {
        console.error("Invalid token: ", error);
        res.status(403).send({ error: "Invalid token." });
    }
};
