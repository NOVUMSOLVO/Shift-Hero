
import React from 'react'
import './App.css'

const App: React.FC = () => {
  const [consentGiven, setConsentGiven] = React.useState(false)

  const handleConsent = () => {
    setConsentGiven(true)
    // TODO: Connect to backend API
  }

  return (
    <div className="app">
      <header>
        <h1>GDPR Consent Management</h1>
      </header>
      <main>
        {!consentGiven ? (
          <div className="consent-form">
            <h2>Data Processing Consent</h2>
            <p>
              We need your consent to process your personal data in accordance 
              with GDPR regulations.
            </p>
            <button onClick={handleConsent}>Give Consent</button>
          </div>
        ) : (
          <div className="confirmation">
            <h2>Thank you!</h2>
            <p>Your consent has been recorded.</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
