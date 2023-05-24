import React from 'react'

const Login = () => {
  return (
    <div>
        <h1>Login To Your Account</h1>
        <form >
            <div>
                <label htmlFor='email'>Email</label>
                <input type="email" name="email" id="email" placeholder='Enter your email' />
            </div>
            <div>
                <labek htmlFor='password'>Password</labek>
                <input type="password" name="password" id="password" placeholder='Enter your password' />
            </div>
            <div>
                <button type="submit">Login</button>
            </div>
        </form>
    </div>
  )
}

export default Login