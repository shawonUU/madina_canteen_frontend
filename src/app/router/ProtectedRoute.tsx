import { Navigate } from "react-router-dom";
import { getToken } from "../../services/storage";

interface Props {
    children: React.ReactNode;
    roles?: string[];
}

const ProtectedRoute = ({ children, roles }: Props) => {
    const token = getToken();

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;