import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, user_id } = await req.json();
    
    console.log('Creating notebook:', { name, user_id });

    if (!name || !user_id) {
      throw new Error('name and user_id are required');
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create the notebook in Supabase database FIRST
    const { data: notebook, error: notebookError } = await supabase
      .from('notebooks')
      .insert({
        name: name,
        user_id: user_id,
        selected_books: [],
        selected_genres: [],
        memory_summary: '',
        key_facts: [],
      })
      .select()
      .single();

    if (notebookError) {
      console.error('Error creating notebook in Supabase:', notebookError);
      throw new Error(`Failed to create notebook: ${notebookError.message}`);
    }

    // Try to call backend API, but don't fail if it's unavailable
    let backendData = null;
    try {
      const backendUrl = new URL('https://evalchatbot-backend.onrender.com/api/notebooks');
      backendUrl.searchParams.append('user_id', user_id);

      const backendResponse = await fetch(backendUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          selected_books: [],
          selected_genres: []
        })
      });

      if (backendResponse.ok) {
        backendData = await backendResponse.json();
        console.log('Backend response:', backendData);
      } else {
        const errorText = await backendResponse.text();
        console.warn('Backend API error (non-blocking):', backendResponse.status, errorText);
      }
    } catch (backendError) {
      console.warn('Backend API call failed (non-blocking):', backendError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notebook: notebook,
        backend_response: backendData
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in create-notebook:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to create notebook' 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        }
      }
    );
  }
});