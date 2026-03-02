// Todas las llamadas al backend pasan por aquí
// Esto permite cambiar la URL fácilmente en producción
// y eventualmente reutilizar esta lógica en React Native

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Error desconocido" }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

// ─── Teams ────────────────────────────────────────────────────────────────────
export const api = {
  teams: {
    list: () => request<{ teams: any[] }>("/teams"),
    get: (id: string) => request<{ team: any }>(`/teams/${id}`),
    create: (data: { name: string; city: string; description?: string }) =>
      request<{ team: any }>("/teams", { method: "POST", body: JSON.stringify(data) }),
  },

  users: {
    get: (id: string) => request<{ user: any }>(`/users/${id}`),
    register: (data: { username: string; email: string; team_id?: string }) =>
      request<{ user: any }>("/users/register", { method: "POST", body: JSON.stringify(data) }),
  },

  replicas: {
    getBySerial: (serial: string) => request<{ replica: any }>(`/replicas/${serial}`),
    create: (data: { model: string; serial_number: string; owner_id: string; photo_url?: string }) =>
      request<{ replica: any }>("/replicas", { method: "POST", body: JSON.stringify(data) }),
    transfer: (id: string, new_owner_id: string) =>
      request<{ message: string }>(`/replicas/${id}/transfer`, {
        method: "PATCH",
        body: JSON.stringify({ new_owner_id }),
      }),
    report: (id: string) =>
      request<{ message: string }>(`/replicas/${id}/report`, { method: "PATCH" }),
  },

  docs: {
    list: (authority?: string) =>
      request<{ docs: any[] }>(`/docs${authority ? `?authority=${authority}` : ""}`),
  },
};
