import { supabase } from './supabaseClient';

function makeEntityClient(table) {
  return {
    async list(sort, limit) {
      let q = supabase.from(table).select('*');
      if (sort) {
        const desc = sort.startsWith('-');
        q = q.order(desc ? sort.slice(1) : sort, { ascending: !desc });
      }
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    async filter(query = {}) {
      let q = supabase.from(table).select('*');
      for (const [key, value] of Object.entries(query)) q = q.eq(key, value);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    async create(body) {
      const { data, error } = await supabase.from(table).insert(body).select().single();
      if (error) throw error;
      return data;
    },
    async update(id, body) {
      const { data, error } = await supabase.from(table).update(body).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    async delete(id) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    },
  };
}

const baseOrder = makeEntityClient('orders');
const Order = {
  ...baseOrder,
  // Public checkout — table has no public INSERT policy (customer PII), so this
  // goes through a SECURITY DEFINER RPC that returns just the created row.
  async create(body) {
    const { data, error } = await supabase.rpc('create_order', {
      p_order_code: body.order_code,
      p_customer_name: body.customer_name,
      p_customer_phone: body.customer_phone,
      p_customer_email: body.customer_email,
      p_address: body.address,
      p_pickup_type: body.pickup_type,
      p_pickup_date: body.pickup_date,
      p_pickup_slot: body.pickup_slot,
      p_items: body.items,
      p_total: body.total,
      p_notes: body.notes,
    });
    if (error) throw error;
    return data;
  },
  // Public track-by-code — table has no public SELECT policy, so this goes
  // through a SECURITY DEFINER RPC scoped to a single order_code match.
  async filter(query = {}) {
    if (query.order_code) {
      const { data, error } = await supabase.rpc('track_order', { p_order_code: query.order_code });
      if (error) throw error;
      return data;
    }
    return baseOrder.filter(query);
  },
};

const baseMember = makeEntityClient('members');
const Member = {
  ...baseMember,
  // Both public signup (Subscription.jsx) and the admin "add member" form call
  // this. Table has no public INSERT policy, so both go through the same RPC.
  async create(body) {
    const { data, error } = await supabase.rpc('create_member', {
      p_full_name: body.full_name,
      p_email: body.email || null,
      p_phone: body.phone,
      p_plan_name: body.plan_name,
      p_status: body.status,
      p_start_date: body.start_date,
      p_end_date: body.end_date,
      p_bookings_used: body.bookings_used,
      p_bookings_allowed: body.bookings_allowed,
      p_items_used: body.items_used,
      p_items_allowed: body.items_allowed,
    });
    if (error) throw error;
    return data;
  },
};

export const api = {
  entities: {
    Category: makeEntityClient('categories'),
    Service: makeEntityClient('services'),
    Item: makeEntityClient('items'),
    SubscriptionPlan: makeEntityClient('subscription_plans'),
    Member,
    Order,
  },
  auth: {
    async login(email, password) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    },
    async me() {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    },
    async logout() {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
  },
};
