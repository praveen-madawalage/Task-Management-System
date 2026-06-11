const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const supabase = require('../utils/supabaseClient');

// Columns safe to return to clients — never includes password_hash.
const PUBLIC_FIELDS = 'id, name, email, role, is_active, must_reset_password, created_at, updated_at';

const emailExists = async (email) => {
    const { data } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();
    return !!data;
};

// Builds a 14-char password guaranteed to satisfy the reset policy:
// at least one uppercase, one lowercase, one digit, and one special char.
// Ambiguous characters (0/O, 1/l/I) are excluded for readability.
const generateTempPassword = () => {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghijkmnpqrstuvwxyz';
    const digits = '23456789';
    const special = '!@#$%^&*';
    const all = upper + lower + digits + special;

    const pick = (set) => set[crypto.randomInt(set.length)];
    const chars = [pick(upper), pick(lower), pick(digits), pick(special)];
    while (chars.length < 14) chars.push(pick(all));

    // Fisher–Yates shuffle so the guaranteed chars aren't always in front.
    for (let i = chars.length - 1; i > 0; i--) {
        const j = crypto.randomInt(i + 1);
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.join('');
};

const createUser = async ({ name, email, role }) => {
    const tempPassword = generateTempPassword();
    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(tempPassword, salt);

    const { data, error } = await supabase
        .from('users')
        .insert({ name, email, password_hash, role, must_reset_password: true })
        .select(PUBLIC_FIELDS)
        .single();

    if (error) throw error;
    return { user: data, tempPassword };
};

const listUsers = async ({ search, role, isActive }) => {
    let query = supabase
        .from('users')
        .select(PUBLIC_FIELDS)
        .order('created_at', { ascending: false });

    if (role) query = query.eq('role', role);
    if (typeof isActive === 'boolean') query = query.eq('is_active', isActive);

    if (search) {
        // Strip characters that have meaning in PostgREST filter syntax so a
        // search term can't alter the query structure.
        const safe = search.replace(/[,()%*\\]/g, '').trim();
        if (safe) query = query.or(`name.ilike.%${safe}%,email.ilike.%${safe}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
};

// Minimal list of users eligible to be task assignees. Only active collaborators
// are assignable — admins and project managers are never task assignees.
const listAssignable = async () => {
    const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('is_active', true)
        .eq('role', 'collaborator')
        .order('name', { ascending: true });

    if (error) throw error;
    return data;
};

const findById = async (id) => {
    const { data, error } = await supabase
        .from('users')
        .select(PUBLIC_FIELDS)
        .eq('id', id)
        .single();

    if (error) return null;
    return data;
};

const updateUser = async (id, fields) => {
    const { data, error } = await supabase
        .from('users')
        .update({ ...fields, updated_at: new Date() })
        .eq('id', id)
        .select(PUBLIC_FIELDS)
        .single();

    if (error) throw error;
    return data;
};

const setActive = async (id, isActive) => {
    const { data, error } = await supabase
        .from('users')
        .update({ is_active: isActive, updated_at: new Date() })
        .eq('id', id)
        .select(PUBLIC_FIELDS)
        .single();

    if (error) throw error;
    return data;
};

module.exports = {
    emailExists,
    generateTempPassword,
    createUser,
    listUsers,
    listAssignable,
    findById,
    updateUser,
    setActive,
};
