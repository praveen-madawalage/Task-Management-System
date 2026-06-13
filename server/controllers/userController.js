const { validationResult } = require('express-validator');
const userService = require('../services/userService');
const { sendOnboardingEmail } = require('../utils/emailService');

const failOnValidation = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() });
        return true;
    }
    return false;
};

const createUser = async (req, res) => {
    if (failOnValidation(req, res)) return;

    const { name, email, role } = req.body;

    if (await userService.emailExists(email)) {
        return res.status(409).json({ error: 'A user with this email already exists' });
    }

    let result;
    try {
        result = await userService.createUser({ name, email, role });
    } catch (err) {
        console.error('Create user failed:', err.message);
        return res.status(500).json({ error: 'Failed to create user' });
    }

    // The account already exists at this point, so a mail failure shouldn't fail
    // the request. We flag it and log the temp password server-side as a fallback
    // so the admin can still onboard the user.
    let emailSent = true;
    try {
        await sendOnboardingEmail(result.user.email, result.user.name, result.tempPassword);
    } catch (err) {
        emailSent = false;
        console.error(`Onboarding email failed for ${result.user.email}:`, err.message);
        console.error(`Temporary password for ${result.user.email}: ${result.tempPassword}`);
    }

    res.status(201).json({
        user: result.user,
        emailSent,
        ...(emailSent
            ? {}
            : { warning: 'User created, but the onboarding email could not be sent. Check server logs for the temporary password.' }),
    });
};

const listAssignable = async (req, res) => {
    try {
        const users = await userService.listAssignable(req.user.userId);
        res.json({ users });
    } catch (err) {
        console.error('List assignable users failed:', err.message);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

const listUsers = async (req, res) => {
    if (failOnValidation(req, res)) return;

    const { search, role } = req.query;
    let isActive;
    if (req.query.isActive === 'true') isActive = true;
    else if (req.query.isActive === 'false') isActive = false;

    try {
        const users = await userService.listUsers({ search, role, isActive });
        res.json({ users });
    } catch (err) {
        console.error('List users failed:', err.message);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

const getUser = async (req, res) => {
    if (failOnValidation(req, res)) return;

    const user = await userService.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
};

const updateUser = async (req, res) => {
    if (failOnValidation(req, res)) return;

    const fields = {};
    if (req.body.name !== undefined) fields.name = req.body.name;
    if (req.body.role !== undefined) fields.role = req.body.role;

    if (Object.keys(fields).length === 0) {
        return res.status(400).json({ error: 'Provide at least one field to update (name or role)' });
    }

    const existing = await userService.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'User not found' });

    try {
        const user = await userService.updateUser(req.params.id, fields);
        res.json({ user });
    } catch (err) {
        console.error('Update user failed:', err.message);
        res.status(500).json({ error: 'Failed to update user' });
    }
};

const setUserStatus = async (req, res) => {
    if (failOnValidation(req, res)) return;

    const existing = await userService.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'User not found' });

    try {
        const user = await userService.setActive(req.params.id, req.body.isActive);
        res.json({ user });
    } catch (err) {
        console.error('Set user status failed:', err.message);
        res.status(500).json({ error: 'Failed to update user status' });
    }
};

module.exports = { createUser, listUsers, listAssignable, getUser, updateUser, setUserStatus };
