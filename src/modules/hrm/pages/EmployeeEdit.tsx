import { useParams } from "react-router-dom";
import EmployeeForm from "../components/EmployeeForm";
export default function EmployeeEdit() {
  const { id } = useParams();
  return <EmployeeForm employeeId={id} />;
}
