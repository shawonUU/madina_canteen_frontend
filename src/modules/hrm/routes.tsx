import EmployeeList from "./pages/EmployeeList";
import DepartmentList from "./pages/DepartmentList";
import DesignationList from "./pages/DesignationList";


const employeeRoutes=[

{
 path:"hrm/employee-management/employee-list",
 element:<EmployeeList/>
},
{
 path:"hrm/configuration/department-list",
 element:<DepartmentList/>
},
{
 path:"hrm/configuration/designation-list",
 element:<DesignationList/>
},

];


export default employeeRoutes;