import RoleLogin from "./RoleLogin";

function AdminLogin() {
  return (
    <RoleLogin
      role="Admin"
      title="Admin Login"
      subtitle="Manage your organization with complete control."
    />
  );
}

export default AdminLogin;