import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">RXautomate</h1>
        <p className="text-xl text-center mb-12">
          Automating UK pharmacy processes including NHS prescription handling, inventory management, and more
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
          {/* NHS Prescription Handling */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">NHS Prescription Handling</h2>
            <p className="mb-4">Automate EPS checks, patient eligibility verification, and SMS reminders</p>
            <Link href="/prescriptions" className="text-blue-600 hover:underline">
              Manage Prescriptions →
            </Link>
          </div>
          
          {/* Inventory Management */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Inventory Management</h2>
            <p className="mb-4">Streamline stock control and auto-order from UK wholesalers</p>
            <Link href="/inventory" className="text-blue-600 hover:underline">
              Manage Inventory →
            </Link>
          </div>
          
          {/* Private Prescriptions */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Private Prescriptions</h2>
            <p className="mb-4">Handle private scripts, travel clinics, and automated billing</p>
            <Link href="/private" className="text-blue-600 hover:underline">
              Manage Private Scripts →
            </Link>
          </div>
          
          {/* Vaccination Campaigns */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Vaccination Campaigns</h2>
            <p className="mb-4">Manage NHS flu jabs, COVID boosters, and appointment scheduling</p>
            <Link href="/vaccinations" className="text-blue-600 hover:underline">
              Manage Vaccinations →
            </Link>
          </div>
          
          {/* GDPR Compliance */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">GDPR Compliance</h2>
            <p className="mb-4">Ensure patient communications are compliant with UK regulations</p>
            <Link href="/gdpr" className="text-blue-600 hover:underline">
              Manage Compliance →
            </Link>
          </div>
          
          {/* Settings */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Settings</h2>
            <p className="mb-4">Configure integrations with NHS APIs and pharmacy systems</p>
            <Link href="/settings" className="text-blue-600 hover:underline">
              Manage Settings →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
