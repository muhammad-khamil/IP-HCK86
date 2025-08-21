import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import http from '../libraries/http'
import Swal from 'sweetalert2'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data } = await http.post("/login", { email, password })
      localStorage.setItem("access_token", data.access_token)
      Swal.fire("Success", "Login berhasil!", "success")
      navigate("/dashboard")
    } catch (error) {
      console.log(error, "<<<")
      Swal.fire("Error", error.response?.data?.message || "Login gagal", "error")
    } finally {
      setLoading(false)
    }
  }

  // FIXED: Handle Google credential dengan error handling yang lebih baik
  async function handleCredentialResponse(response) {
  setGoogleLoading(true)

  try {
    const balikan = await http.post('/auth/google-login', {
      googleToken: response.credential
    });
    console.log(balikan);

    // Simpan token aja
    localStorage.setItem('access_token', balikan.data.access_token);

    Swal.fire("Berhasil Login", "", "success")
    navigate("/dashboard")
    
  } catch (error) {
    console.log(error, "<<<");

    let errorMessage = 'Something went wrong!';
    if (error.response) {
      errorMessage = error.response.data.message;
    }

    Swal.fire({
      title: 'Error!',
      text: errorMessage,
      icon: 'error',
      confirmButtonText: 'Close'
    });
  } finally {
    setGoogleLoading(false)
  }
}

useEffect(() => {
  if (localStorage.getItem("access_token")) {
    return navigate("/dashboard")
  }

    google.accounts.id.initialize({
      client_id: "113552314369-0pcb8mlv3bqi2b4hcoepou1jkts64o4j.apps.googleusercontent.com",
      callback: handleCredentialResponse
    });

    google.accounts.id.renderButton(
      document.getElementById("google-login"),
      { theme: "outline", size: "large" }
    );

}, []);


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Masuk</h1>
          <p className="text-gray-600">Masuk ke akun SPPD App Anda</p>
        </div>

        {/* Google Login Section */}
        <div className="mb-6">
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600">Masuk dengan Google</p>
          </div>
          
          <div className="relative">
            <div id='google-login' className="flex justify-center"></div>
            
            {googleLoading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-2"></div>
                  <span className="text-sm text-gray-600">Login dengan Google...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">atau</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="nama@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Masukkan password"
            />
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${(loading || googleLoading)
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 transform hover:-translate-y-1 hover:shadow-lg'
              } text-white`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Masuk...
              </div>
            ) : (
              'Masuk dengan Email'
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Belum punya akun?{' '}
            <Link to="/register" className="text-blue-500 hover:text-blue-600 font-medium hover:underline">
              Daftar di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}