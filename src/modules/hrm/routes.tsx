import { lazy } from "react";
import { Navigate, useParams } from "react-router-dom";
import ProtectedRoute from "../../app/router/ProtectedRoute";
const EmployeeList = lazy(() => import("./pages/EmployeeList"));
const EmployeeCreate = lazy(() => import("./pages/EmployeeCreate"));
const EmployeeEdit = lazy(() => import("./pages/EmployeeEdit"));
const DepartmentList = lazy(() => import("./pages/DepartmentList"));
const DesignationList = lazy(() => import("./pages/DesignationList"));
const employeeListPath = "/hrm/employee-management/employee-list";

function EmployeeEditRedirect() {
  const { id } = useParams();
  return <Navigate to={`${employeeListPath}/${id}/edit`} replace />;
}

const employeeRoutes = [
  { path: "/hrm/employee-management/employee-list", element: <ProtectedRoute><EmployeeList /></ProtectedRoute> },
  { path: "/hrm/employee-management/employee-list/create", element: <ProtectedRoute><EmployeeCreate /></ProtectedRoute> },
  { path: "/hrm/employee-management/employee-list/:id/edit", element: <ProtectedRoute><EmployeeEdit /></ProtectedRoute> },
  { path: "/hrm/configuration/department-list", element: <ProtectedRoute><DepartmentList /></ProtectedRoute> },
  { path: "/hrm/configuration/designation-list", element: <ProtectedRoute><DesignationList /></ProtectedRoute> },
  { path: "/hrm/employees", element: <Navigate to={employeeListPath} replace /> },
  { path: "/hrm/employees/create", element: <Navigate to={`${employeeListPath}/create`} replace /> },
  { path: "/hrm/employees/:id/edit", element: <EmployeeEditRedirect /> },
];
export default employeeRoutes;
