const API_BASE_URL = "https://story-api.dicoding.dev/v1";

export const getAllStories = async () => {
	const token = localStorage.getItem("token");
	if (!token)
		throw new Error("Token tidak ditemukan. Silakan login terlebih dahulu.");

	const response = await fetch(`${API_BASE_URL}/stories?location=1`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.message || "Gagal mengambil stories");
	}

	return await response.json();
};

export const sendStory = async ({ description, photo, lat, lon }) => {
	const token = localStorage.getItem("token");
	if (!token) throw new Error("Anda belum login.");

	const formData = new FormData();
	formData.append("description", description);
	if (photo) formData.append("photo", photo);
	if (lat && lon) {
		formData.append("lat", lat);
		formData.append("lon", lon);
	}

	const response = await fetch(`${API_BASE_URL}/stories`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
		},
		body: formData,
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.message || "Gagal mengirim story");
	}

	return await response.json();
};

export const login = async ({ email, password }) => {
	const response = await fetch(`${API_BASE_URL}/login`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email, password }),
	});

	const data = await response.json();
	if (!response.ok) {
		throw new Error(data.message || "Login gagal");
	}

	const { loginResult } = data;

	return loginResult;
};

export const register = async ({ name, email, password }) => {
	const response = await fetch(`${API_BASE_URL}/register`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name, email, password }),
	});

	const data = await response.json();
	if (!response.ok) {
		throw new Error(data.message || "Pendaftaran gagal");
	}

	return data;
};
