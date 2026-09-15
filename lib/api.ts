const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function loginUser(
  username: string,
  password: string
) {
  const response = await fetch(`${API_URL}/auth/login/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.errors?.non_field_errors?.[0] ||
        data?.errors?.detail ||
        data?.detail ||
        "Login failed"
    );
  }

  return data;
}


export async function getDashboard() {
  const token = localStorage.getItem("access");

  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_URL}/dashboard/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const data = await response.json();

  if (response.status === 401) {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");

    throw new Error("Session expired");
  }

  if (!response.ok) {
    throw new Error(
      data?.detail || "Failed to load dashboard"
    );
  }

  return data;
}


export async function getAlerts(page?: number) {
  const token = localStorage.getItem("access");

  if (!token) {
    throw new Error("Authentication required");
  }

  const url = page
    ? `${API_URL}/alerts/?page=${page}`
    : `${API_URL}/alerts/`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const data = await response.json();

  if (response.status === 401) {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");

    throw new Error("Session expired");
  }

  if (!response.ok) {
    throw new Error(
      data?.detail || "Failed to load alerts"
    );
  }

  return data;
}


export async function getAlert(id: number) {
  const token = localStorage.getItem("access");

  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_URL}/alerts/${id}/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const data = await response.json();

  if (response.status === 401) {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");

    throw new Error("Session expired");
  }

  if (!response.ok) {
    throw new Error(
      data?.detail || "Failed to load alert"
    );
  }

  return data;
}
export async function getLogs(page?: number) {
  const token = localStorage.getItem("access");

  if (!token) {
    throw new Error("Authentication required");
  }

  const url = page
    ? `${API_URL}/logs/?page=${page}`
    : `${API_URL}/logs/`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const data = await response.json();

  if (response.status === 401) {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    throw new Error("Session expired");
  }

  if (!response.ok) {
    throw new Error(
      data?.detail || "Failed to load logs"
    );
  }

  return data;
}