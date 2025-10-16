import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiService } from "../services/api";

import type { User } from "../types";

const UserDetails = () => {
  const [user, setUser] = useState<User | null>(null);
  const params = useParams()
  useEffect(() => {
    (async () => {
      const userDetails = await apiService.get<User>(`/users/${params.id}`)
      setUser(userDetails)
    })()
  }, [params.id])
  return (
    <div className="d-flex items-center justify-center text-white">
      <p>ID of the current user {params.id}</p>
      <p>Salary: {user?.salary}</p>
    </div>
  )
}

export default UserDetails;
