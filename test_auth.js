const SUPABASE_URL = 'https://xrapcmiewsbtnflpzueb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYXBjbWlld3NidG5mbHB6dWViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMzg0ODgsImV4cCI6MjA4ODkxNDQ4OH0.OeZ1s0kDkRCvgQZLM9H4L7xoF3k2I6cXh-cpD1J4dBI';

async function testAuth() {
    try {
        console.log("Testing SignIn...");
        let res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'andres@lottaburgers.com',
                password: '44091321'
            })
        });
        console.log("SignIn status:", res.status);
        console.log("SignIn response:", await res.json());

        console.log("\nTesting SignUp...");
        res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'andres@lottaburgers.com',
                password: '44091321',
                data: { name: 'Andres Viscusi' }
            })
        });
        console.log("SignUp status:", res.status);
        console.log("SignUp response:", await res.json());

    } catch (e) {
        console.error("Test failed:", e);
    }
}

testAuth();
