import { db, auth, storage } from "../config/firebase.js";
import { doc, addDoc, setDoc, collection, getDocs, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, deleteUser as authDeleteUser, updatePassword } from "firebase/auth";
import bcrypt from "bcrypt";

const usersCollection = collection(db, 'users');

const validCategoriesAddition = ["Salary", "Investments", "Part-Time", "Bonus", "Others"];

const validCategoriesReduction = [
    "Parents", "Shopping", "Food", "Phone", "Entertainment", "Education", "Beauty",
    "Sports", "Social", "Transportations", "Clothing", "Car", "Alcohol", "Cigarettes",
    "Electronics", "Travel", "Health", "Pets", "Repairs", "Housing", "Home", "Gifts",
    "Donations", "Lottery", "Snacks", "Kids", "Vegetables", "Fruits"
];

const validCategories = [...validCategoriesAddition, ...validCategoriesReduction];

export const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).send({ error: "username, email, and password are required." });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const { user: authUser } = userCredential;

        const userRef = doc(usersCollection, authUser.uid);
        const userData = {
            username,
            email,
            passwordHash: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        await setDoc(userRef, userData);

        const savingsCollectionRef = collection(userRef, "savings");
        const savingData = {
            amount: 0,
            createdAt: new Date(),
        };
        await addDoc(savingsCollectionRef, savingData);

        res.status(201).send({
            message: "User registered successfully!",
            data: {
                user: userData,
                saving: savingData,
            },
        });
    } catch (error) {
        console.error("Error register user: ", error);
        res.status(500).send({ error: error.message });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).send({ error: "Email and password are required." });
        }

        const result = await signInWithEmailAndPassword(auth, email, password);

        res.status(200).send({
            message: "Login success.",
            data: {
                user: JSON.parse(JSON.stringify(result.user)),
            }
        });
    } catch (error) {
        console.error("Error login user: ", error);
        res.status(500).send({ error: "Error login user!" });
    }
};

export const updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { username, password, newPassword } = req.body;

        if (!username && !password && !newPassword) {
            return res.status(400).send({ error: "At least one field (username, password, newPassword) is required to update." });
        }

        const userRef = doc(usersCollection, userId);
        const userSnapshot = await getDoc(userRef);

        if (!userSnapshot.exists()) {
            return res.status(404).send({ error: "User not found." });
        }

        const userData = userSnapshot.data();

        const updatedData = {
            ...userData,
            updatedAt: new Date(),
        };

        if (username) {
            updatedData.username = username;
        }

        if (password && newPassword) {
            const isPasswordValid = await bcrypt.compare(password, userData.passwordHash);
            if (!isPasswordValid) {
                return res.status(403).send({ error: "Current password is incorrect." });
            }

            const saltRounds = 10;
            const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
            await updatePassword(auth.currentUser, newPassword);
            updatedData.passwordHash = hashedNewPassword;
        }

        await updateDoc(userRef, updatedData);

        res.status(200).send({
            message: "User updated successfully.",
            data: {
                id: userId,
                ...updatedData,
            },
        });
    } catch (error) {
        console.error("Error updating user: ", error);
        res.status(500).send({ error: "Error updating user!" });
    }
};

export const uploadFile = async (file, folder = "uploads") => {
    const fileRef = ref(storage, `${folder}/${Date.now()}-${file.originalname}`);
    await uploadBytes(fileRef, file.buffer);
    const downloadURL = await getDownloadURL(fileRef);
    return downloadURL;
};

export const updatePhoto = async (req, res) => {
    try {
        const { userId } = req.params;
        const file = req.file;

        if (!file) {
            return res.status(400).send({ error: "Photo file is required." });
        }

        const photoUrl = await uploadFile(file, `profile-photos/${userId}`);

        const userRef = doc(db, "users", userId);
        const userSnapshot = await getDoc(userRef);

        if (!userSnapshot.exists()) {
            return res.status(404).send({ error: "User not found." });
        }

        await updateDoc(userRef, { photoUrl, updatedAt: new Date() });

        res.status(200).send({
            message: "Profile photo updated successfully.",
            data: { photoUrl },
        });
    } catch (error) {
        console.error("Error updating photo: ", error);
        res.status(500).send({ error: "Error updating photo!" });
    }
};


export const getUser = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).send({ error: "User ID is required." });
        }

        const userRef = doc(usersCollection, userId);
        const userSnapshot = await getDoc(userRef);

        if (!userSnapshot.exists()) {
            return res.status(404).send({ error: "User not found." });
        }

        const userData = userSnapshot.data();

        res.status(200).send({
            message: "User fetched successfully.",
            data: {
                id: userSnapshot.id,
                ...userData,
            },
        });
    } catch (error) {
        console.error("Error fetching user: ", error);
        res.status(500).send({ error: "Error fetching user!" });
    }
};


export const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const userRef = doc(db, "users", userId);
        const userSnapshot = await getDoc(userRef);

        if (!userSnapshot.exists()) {
            return res.status(404).send({ error: "User not found." });
        }

        const savingsCollectionRef = collection(userRef, "savings");
        const savingsSnapshot = await getDocs(savingsCollectionRef);

        if (!savingsSnapshot.empty) {
            for (const savingDoc of savingsSnapshot.docs) {
                const savingRef = doc(savingsCollectionRef, savingDoc.id);
                const additionCollectionRef = collection(savingRef, "addition");
                const reductionCollectionRef = collection(savingRef, "reduction");
                const goalsCollectionRef = collection(savingRef, "goals");

                const additionsSnapshot = await getDocs(additionCollectionRef);
                additionsSnapshot.forEach(async (addDoc) => {
                    await deleteDoc(doc(additionCollectionRef, addDoc.id));
                });

                const reductionsSnapshot = await getDocs(reductionCollectionRef);
                reductionsSnapshot.forEach(async (redDoc) => {
                    await deleteDoc(doc(reductionCollectionRef, redDoc.id));
                });

                const goalsSnapshot = await getDocs(goalsCollectionRef);
                goalsSnapshot.forEach(async (goalDoc) => {
                    await deleteDoc(doc(goalsCollectionRef, goalDoc.id));
                });

                await deleteDoc(savingRef);
            }
        }

        await deleteDoc(userRef);

        const user = auth.currentUser;
        if (user.uid === userId) {
            await authDeleteUser(user);
        } else {
            throw new Error("Cannot delete user: Authenticated user does not match the target user ID.");
        }

        res.status(200).send({ message: "User deleted successfully." });
    } catch (error) {
        console.error("Error deleting user: ", error);
        res.status(500).send({ error: "Error deleting user!" });
    }
};


export const getSavings = async (req, res) => {
    try {
        const { userId } = req.params;

        const userRef = doc(usersCollection, userId);
        const savingsCollectionRef = collection(userRef, "savings");
        const savingsSnapshot = await getDocs(savingsCollectionRef);

        if (savingsSnapshot.empty) {
            return res.status(404).send({ error: "No savings found!" });
        }

        const savingDoc = savingsSnapshot.docs[0];
        const savingRef = doc(savingsCollectionRef, savingDoc.id);

        const additionCollectionRef = collection(savingRef, "addition");
        const additionsSnapshot = await getDocs(additionCollectionRef);
        const additions = additionsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        const totalAdditions = additions.reduce((total, item) => total + item.amount, 0);

        const reductionCollectionRef = collection(savingRef, "reduction");
        const reductionsSnapshot = await getDocs(reductionCollectionRef);
        const reductions = reductionsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        const totalReductions = reductions.reduce((total, item) => total + item.amount, 0);

        const savingData = savingDoc.data();

        res.status(200).send({
            message: "Savings fetched successfully.",
            data: {
                id: savingDoc.id,
                userId,
                amount: savingData.amount,
                totalAdditions,
                totalReductions,
                additions,
                reductions,
            },
        });
    } catch (e) {
        console.error("Error getting savings: ", e);
        res.status(500).send({ error: "Error fetching savings!" });
    }
};

export const addSavings = async (req, res) => {
    try {
        const { userId } = req.params;
        const { amount, description, category } = req.body;

        if (typeof amount !== "number" || amount <= 0 || !description || !category) {
            return res.status(400).send({ error: 'Amount, description, and category are required.' });
        }

        if (!validCategoriesAddition.includes(category)) {
            return res.status(400).send({ error: `Invalid category. Allowed categories are: ${validCategoriesAddition.join(", ")}.` });
        }

        const userRef = doc(db, "users", userId);
        const savingsCollectionRef = collection(userRef, "savings");
        const savingsSnapshot = await getDocs(savingsCollectionRef);

        if (savingsSnapshot.empty) {
            return res.status(404).send({ error: 'Saving not found.' });
        }

        const savingDoc = savingsSnapshot.docs[0];
        const savingRef = doc(savingsCollectionRef, savingDoc.id);

        const existingData = savingDoc.data();
        const updatedAmount = existingData.amount + amount;

        await updateDoc(savingRef, {
            amount: updatedAmount,
            updatedAt: new Date(),
        });

        const additionCollectionRef = collection(savingRef, "addition");
        const transactionData = {
            amount,
            description,
            category,
            createdAt: new Date(),
        };

        await addDoc(additionCollectionRef, transactionData);

        res.status(200).send({
            message: "Addition success!",
            data: {
                id: savingDoc.id,
                userId,
                updatedAmount,
                transaction: transactionData,
            },
        });
    } catch (error) {
        console.error("Error adding savings: ", error);
        res.status(500).send({ error: 'Error adding savings!' });
    }
};

export const reduceSavings = async (req, res) => {
    try {
        const { userId } = req.params;
        const { amount, description, category } = req.body;

        if (typeof amount !== "number" || amount <= 0 || !description || !category) {
            return res.status(400).send({ error: 'Amount, description, and category are required.' });
        }

        if (!validCategoriesReduction.includes(category)) {
            return res.status(400).send({ error: `Invalid category. Allowed categories are: ${validCategoriesReduction.join(", ")}.` });
        }

        const userRef = doc(db, "users", userId);
        const savingsCollectionRef = collection(userRef, "savings");
        const savingsSnapshot = await getDocs(savingsCollectionRef);

        if (savingsSnapshot.empty) {
            return res.status(404).send({ error: 'Saving not found.' });
        }

        const savingDoc = savingsSnapshot.docs[0];
        const savingRef = doc(savingsCollectionRef, savingDoc.id);

        const existingData = savingDoc.data();
        if (existingData.amount < amount) {
            return res.status(400).send({ error: 'Insufficient saving amount to reduce.' });
        }

        const updatedAmount = existingData.amount - amount;

        await updateDoc(savingRef, {
            amount: updatedAmount,
            updatedAt: new Date(),
        });

        const reductionCollectionRef = collection(savingRef, "reduction");
        const transactionData = {
            amount,
            description,
            category,
            createdAt: new Date(),
        };

        await addDoc(reductionCollectionRef, transactionData);

        res.status(200).send({
            message: "Reduction success!",
            data: {
                id: savingDoc.id,
                userId,
                updatedAmount,
                transaction: transactionData,
            },
        });
    } catch (error) {
        console.error("Error reducing savings: ", error);
        res.status(500).send({ error: 'Error reducing savings!' });
    }
};

export const getCategory = async (req, res) => {
    try {
        const { userId, savingId } = req.params;
        const { category } = req.body;

        if (!category) {
            return res.status(400).send({ error: 'Category is required.' });
        }

        if (!validCategories.includes(category)) {
            return res.status(400).send({
                error: `Invalid category. Allowed categories are: ${validCategories.join(", ")}.`,
            });
        }

        const savingRef = doc(db, "users", userId, "savings", savingId);
        const savingSnapshot = await getDoc(savingRef);

        if (!savingSnapshot.exists()) {
            return res.status(404).send({ error: 'Saving not found.' });
        }

        const additionCollectionRef = collection(savingRef, "addition");
        const reductionCollectionRef = collection(savingRef, "reduction");

        const additionsSnapshot = await getDocs(additionCollectionRef);
        const reductionsSnapshot = await getDocs(reductionCollectionRef);

        const filteredAdditions = additionsSnapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .filter((item) => item.category === category);

        const filteredReductions = reductionsSnapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .filter((item) => item.category === category);

        res.status(200).send({
            message: `History for category: ${category}`,
            data: {
                additions: filteredAdditions,
                reductions: filteredReductions,
            },
        });
    } catch (error) {
        console.error("Error fetching history by category: ", error);
        res.status(500).send({ error: 'Error fetching history by category!' });
    }
};

export const updateTransaction = async (req, res) => {
    try {
        const { userId, savingId, transactionId } = req.params;
        const { amount, description, category } = req.body;

        if (!userId || !savingId || !transactionId) {
            return res.status(400).send({
                error: 'userId, savingId, and transactionId are required.',
            });
        }

        if (category && !validCategories.includes(category)) {
            return res.status(400).send({
                error: `Invalid category. Allowed categories are: ${validCategories.join(
                    ', '
                )}.`,
            });
        }

        const savingRef = doc(db, 'users', userId, 'savings', savingId);
        const savingSnapshot = await getDoc(savingRef);

        if (!savingSnapshot.exists()) {
            return res.status(404).send({ error: 'Saving not found.' });
        }

        const savingData = savingSnapshot.data();
        const additionCollectionRef = collection(savingRef, 'addition');
        const reductionCollectionRef = collection(savingRef, 'reduction');

        let transactionRef = null;
        let transactionType = null;
        let originalAmount = 0;

        transactionRef = doc(additionCollectionRef, transactionId);
        const additionSnapshot = await getDoc(transactionRef);

        if (additionSnapshot.exists()) {
            transactionType = 'addition';
            originalAmount = additionSnapshot.data().amount;
        } else {
            transactionRef = doc(reductionCollectionRef, transactionId);
            const reductionSnapshot = await getDoc(transactionRef);

            if (reductionSnapshot.exists()) {
                transactionType = 'reduction';
                originalAmount = reductionSnapshot.data().amount;
            } else {
                return res.status(404).send({
                    error: 'Transaction not found in addition or reduction collections.',
                });
            }
        }

        const updatedTransaction = {
            updatedAt: new Date(),
        };

        if (amount !== undefined) {
            if (typeof amount !== 'number' || amount <= 0) {
                return res.status(400).send({
                    error: 'Amount must be a positive number.',
                });
            }
            updatedTransaction.amount = amount;
        }
        if (description !== undefined) {
            updatedTransaction.description = description;
        }
        if (category !== undefined) {
            updatedTransaction.category = category;
        }

        await updateDoc(transactionRef, updatedTransaction);

        let updatedAmount = savingData.amount;
        if (amount !== undefined) {
            if (transactionType === 'addition') {
                updatedAmount = savingData.amount - originalAmount + amount;
            } else if (transactionType === 'reduction') {
                updatedAmount = savingData.amount + originalAmount - amount;
            }
        }

        if (amount !== undefined) {
            await updateDoc(savingRef, {
                amount: updatedAmount,
                updatedAt: new Date(),
            });
        }

        res.status(200).send({
            message: `Transaction updated successfully in ${transactionType}.`,
            data: {
                transactionId,
                updatedTransaction,
                updatedAmount,
            },
        });
    } catch (error) {
        console.error('Error updating transaction: ', error);
        res.status(500).send({ error: 'Error updating transaction!' });
    }
};

export const deleteTransaction = async (req, res) => {
    try {
        const { transactionId, userId, savingId } = req.params;

        const userRef = doc(db, "users", userId);
        const savingsCollectionRef = collection(userRef, "savings");
        const savingRef = doc(savingsCollectionRef, savingId);

        const savingSnapshot = await getDoc(savingRef);
        if (!savingSnapshot.exists()) {
            return res.status(404).send({ error: 'Saving not found.' });
        }

        let transactionRef = null;
        let transactionCollectionRef = null;
        let transactionAmount = 0;

        transactionCollectionRef = collection(savingRef, "addition");
        transactionRef = doc(transactionCollectionRef, transactionId);
        const transactionSnapshot = await getDoc(transactionRef);

        if (transactionSnapshot.exists()) {
            transactionAmount = transactionSnapshot.data().amount;

            await deleteDoc(transactionRef);
            const updatedAmount = savingSnapshot.data().amount - transactionAmount;
            await updateDoc(savingRef, { amount: updatedAmount });

            return res.status(200).send({
                message: "Transaction deleted successfully from 'addition'.",
                updatedAmount,
            });
        }

        transactionCollectionRef = collection(savingRef, "reduction");
        transactionRef = doc(transactionCollectionRef, transactionId);

        const transactionSnapshotReduction = await getDoc(transactionRef);

        if (transactionSnapshotReduction.exists()) {
            transactionAmount = transactionSnapshotReduction.data().amount;

            await deleteDoc(transactionRef);
            const updatedAmount = savingSnapshot.data().amount + transactionAmount;
            await updateDoc(savingRef, { amount: updatedAmount });

            return res.status(200).send({
                message: "Transaction deleted successfully from 'reduction'.",
            });
        }

        return res.status(404).send({ error: 'Transaction not found in "addition" or "reduction" collections.' });

    } catch (error) {
        console.error("Error deleting transaction: ", error);
        res.status(500).send({ error: "Error deleting transaction!" });
    }
};


export const addGoal = async (req, res) => {
    try {
        const { userId, savingId } = req.params;
        const { title, targetAmount } = req.body;

        if (!title || !targetAmount) {
            return res.status(400).send({ error: 'title or targetAmount are required.' });
        }

        const savingRef = doc(usersCollection, userId, "savings", savingId);
        const savingSnapshot = await getDoc(savingRef);

        if (!savingSnapshot.exists()) {
            return res.status(404).send({ error: 'Saving not found.' });
        }

        const savingData = savingSnapshot.data();
        const totalAmount = savingData.amount;

        const status = totalAmount >= targetAmount ? "Completed" : "On-Progress";

        const goalsCollectionRef = collection(savingRef, "goals");
        const goalData = { title, targetAmount, status };
        const goalRef = await addDoc(goalsCollectionRef, goalData);

        res.status(201).send({
            id: goalRef.id,
            ...goalData,
        });
    } catch (error) {
        console.error("Error adding goal: ", error);
        res.status(500).send({ error: 'Error adding goal!' });
    }
};


export const getGoals = async (req, res) => {
    try {
        const { userId, savingId } = req.params;

        if (!userId || !savingId) {
            return res.status(400).send({ error: 'userId and savingId are required.' });
        }

        const savingRef = doc(db, "users", userId, "savings", savingId);
        const savingSnapshot = await getDoc(savingRef);

        if (!savingSnapshot.exists()) {
            return res.status(404).send({ error: 'Saving not found.' });
        }

        const savingData = savingSnapshot.data();

        const goalsCollectionRef = collection(savingRef, "goals");
        const goalsSnapshot = await getDocs(goalsCollectionRef);

        if (goalsSnapshot.empty) {
            return res.status(404).send({ error: 'No goals found.' });
        }

        const goals = goalsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        const response = {
            id: savingId,
            userId,
            amount: savingData.amount,
            goals: goals,
        };

        res.status(200).send(response);
    } catch (error) {
        console.error("Error fetching saving with goals: ", error);
        res.status(500).send({ error: 'Error fetching saving with goals!' });
    }
};


export const updateGoal = async (req, res) => {
    try {
        const { userId, savingId, goalId } = req.params;
        const { title, targetAmount } = req.body;

        if (!userId || !savingId || !goalId) {
            return res.status(400).send({ error: 'userId, savingId, and goalId are required.' });
        }

        const goalRef = doc(db, "users", userId, "savings", savingId, "goals", goalId);

        const goalSnapshot = await getDoc(goalRef);
        if (!goalSnapshot.exists()) {
            return res.status(404).send({ error: 'Goal not found.' });
        }

        const goalData = goalSnapshot.data();

        const savingRef = doc(db, "users", userId, "savings", savingId);
        const savingSnapshot = await getDoc(savingRef);

        if (!savingSnapshot.exists()) {
            return res.status(404).send({ error: 'Saving not found.' });
        }

        const savingData = savingSnapshot.data();
        const { amount } = savingData;

        const updatedData = {
            title: title || goalData.title,
            targetAmount: targetAmount || goalData.targetAmount,
        };

        const updatedTargetAmount = updatedData.targetAmount;
        updatedData.status = amount >= updatedTargetAmount ? "Completed" : "On-Progress";

        await updateDoc(goalRef, updatedData);

        res.status(200).send({
            id: goalId,
            savingId: savingId,
            ...updatedData,
            amount: amount,
        });
    } catch (error) {
        console.error("Error updating goal: ", error);
        res.status(500).send({ error: 'Error updating goal!' });
    }
};


export const deleteGoal = async (req, res) => {
    try {
        const { userId, savingId, goalId } = req.params;

        if (!userId || !savingId || !goalId) {
            return res.status(400).send({ error: 'userId, savingId, and goalId are required.' });
        }

        const goalRef = doc(db, "users", userId, "savings", savingId, "goals", goalId);

        const goalSnapshot = await getDoc(goalRef);
        if (!goalSnapshot.exists()) {
            return res.status(404).send({ error: 'Goal not found.' });
        }

        await deleteDoc(goalRef);

        res.status(200).send({ message: 'Goal deleted successfully.', goalId, savingId });
    } catch (error) {
        console.error("Error deleting goal: ", error);
        res.status(500).send({ error: 'Error deleting goal!' });
    }
};
