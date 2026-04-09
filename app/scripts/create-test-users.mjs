import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno')
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

const TEMP_PASSWORD = 'Puma2026!Temp'

const users = [
  { display_name: 'Juan Viscarro', email: 'juan@test.com' },
  { display_name: 'Rafa Gonzalez', email: 'rafa@test.com' },
  { display_name: 'Carles Guillaument', email: 'carles@test.com' },
  { display_name: 'Ricard Soria', email: 'ricky@test.com' },
  { display_name: 'Jaime Bascuñan', email: 'jaime@test.com' },
  { display_name: 'Albert Español', email: 'espa@test.com' },
  { display_name: 'Gorka SanMartin', email: 'gorka@test.com' },
  { display_name: 'Didac Ramal', email: 'didac@test.com' },
  { display_name: 'Miguel', email: 'miguel@test.com' },
  { display_name: 'Dani Exposito', email: 'dani@test.com' },
]

async function main() {
  for (const user of users) {
    const email = user.email.toLowerCase().trim()
    const displayName = user.display_name.trim()

    console.log(`Creando usuario: ${email}`)

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: TEMP_PASSWORD,
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
      },
    })

    if (authError) {
      console.error(`Error creando ${email}:`, authError.message)
      continue
    }

    const authUser = authData.user

    if (!authUser) {
      console.error(`No se devolvió usuario auth para ${email}`)
      continue
    }

    const { error: usersError } = await supabase
      .from('users')
      .upsert(
        {
          id: authUser.id,
          email,
          display_name: displayName,
          is_admin: false,
        },
        { onConflict: 'id' }
      )

    if (usersError) {
      console.error(`Error insertando public.users para ${email}:`, usersError.message)
      continue
    }

    const { error: profilesError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: authUser.id,
          email,
          display_name: displayName,
          role: 'user',
          must_change_password: true,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )

    if (profilesError) {
      console.error(`Error insertando public.profiles para ${email}:`, profilesError.message)
      continue
    }

    console.log(`OK: ${email}`)
  }

  console.log('Proceso completado')
}

main().catch((err) => {
  console.error('Error general:', err)
  process.exit(1)
})