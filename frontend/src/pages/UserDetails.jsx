import { user, updateUser, replaceUser } from "../store/UserStore";
import { createSignal } from "solid-js";

export default function UserDetails() {
  const [avatarPreview, setAvatarPreview] = createSignal(user.profilePicture);

  // Handle avatar file selection
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Optionally: Preview the image
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);

    // --- Upload logic (replace with your backend endpoint) ---
    const formData = new FormData();
    formData.append("avatar", file);
    formData.append("user_id", user.id);

    await fetch("http://127.0.0.1:5000/api/users", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${user.jwt}`,
      },
      body: JSON.stringify({
        user_id: user.id,
        profilePicture: avatar, // or any other fields you want to update
      }),
    });
    if (response.ok) {
      const data = await response.json();
      updateUser({ profilePicture: data.profilePicture });
      setAvatarPreview(data.profilePicture);
    } else {
      alert("Failed to upload avatar.");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "2rem auto", textAlign: "center" }}>
      <h2>User Details</h2>
      <img
        src={avatarPreview() || "https://via.placeholder.com/100"}
        alt="Avatar"
        style={{ borderRadius: "50%", width: "100px", height: "100px", objectFit: "cover" }}
      />
      <div>
        <input type="file" accept="image/*" onChange={handleAvatarChange} />
      </div>
      <div style={{ marginTop: "1rem", textAlign: "left" }}>
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email || "N/A"}</p>
        <p><strong>Logged In Via:</strong> {user.provider}</p>
      </div>
    </div>
  );
}