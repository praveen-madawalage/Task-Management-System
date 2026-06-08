const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const supabase = require('../utils/supabaseClient');

const findUserByEmail = async (email) => {
    const { data, error } = await supabase
        .from('users')
        .select('id, name, email, password_hash, role, is_active, must_reset_password')
        .eq('email', email)
        .single();

    if (error) return null;
    return data;
};

const findUserById = async (id) => {
    const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role, is_active, must_reset_password')
        .eq('id', id)
        .single();

    if (error) return null;
    return data;
};

const getUserPasswordHash = async (userId) => {
    const { data, error } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', userId)
        .single();

    if (error) return null;
    return data?.password_hash;
};

const validatePassword = (plain, hash) => {
    return bcrypt.compare(plain, hash);
};

const generateAccessToken = (user) => {
    return jwt.sign(
        { userId: user.id, role: user.role, mustResetPassword: !!user.must_reset_password },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
};

const generateRefreshToken = () => {
    return crypto.randomBytes(64).toString('hex');
};

const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

const saveRefreshToken = async (userId, token) => {
    const tokenHash = hashToken(token);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS));

    const { error } = await supabase
        .from('refresh_tokens')
        .insert({ user_id: userId, token_hash: tokenHash, expires_at: expiresAt });

    if (error) throw new Error('Failed to save refresh token');
};

const findRefreshToken = async (token) => {
    const tokenHash = hashToken(token);
    const { data, error } = await supabase
        .from('refresh_tokens')
        .select('user_id, expires_at')
        .eq('token_hash', tokenHash)
        .single();

    if (error) return null;
    return data;
};

const deleteRefreshToken = async (token) => {
    const tokenHash = hashToken(token);
    await supabase.from('refresh_tokens').delete().eq('token_hash', tokenHash);
};

const deleteAllRefreshTokensForUser = async (userId) => {
    await supabase.from('refresh_tokens').delete().eq('user_id', userId);
};

const deleteExpiredRefreshTokens = async () => {
    const { error } = await supabase
        .from('refresh_tokens')
        .delete()
        .lt('expires_at', new Date().toISOString());

    if (error) throw new Error('Failed to delete expired refresh tokens');
};

const updatePassword = async (userId, newPassword) => {
    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(newPassword, salt);

    const { error } = await supabase
        .from('users')
        .update({ password_hash, must_reset_password: false, updated_at: new Date() })
        .eq('id', userId);

    if (error) throw new Error('Failed to update password');

    // A password change must end every existing session, so all refresh tokens
    // for this user are revoked. The caller is responsible for issuing a fresh
    // token pair for the current session if it should stay logged in.
    await deleteAllRefreshTokensForUser(userId);
};

module.exports = {
    findUserByEmail,
    findUserById,
    getUserPasswordHash,
    validatePassword,
    generateAccessToken,
    generateRefreshToken,
    saveRefreshToken,
    findRefreshToken,
    deleteRefreshToken,
    deleteAllRefreshTokensForUser,
    deleteExpiredRefreshTokens,
    updatePassword,
};
