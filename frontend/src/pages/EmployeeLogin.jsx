import RoleLogin from "./RoleLogin";

function EmployeeLogin() {
  return (
    <RoleLogin
      role="Team Member"
      title="Employee Login"
      subtitle="View your tasks, update progress, and collaborate with your team."
    />
  );
}

export default EmployeeLogin;