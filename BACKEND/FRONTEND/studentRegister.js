document.getElementById("studentRegisterForm").addEventListener("submit", async function (event) {
  event.preventDefault();

  const studentData = {
    name: document.getElementById("name").value,
    phone: document.getElementById("phone").value,
    email: document.getElementById("email").value,
    registerNumber: document.getElementById("regno").value,
    registerPassword: document.getElementById("regpass").value,
    department: document.getElementById("department").value,
    branch: document.getElementById("branch").value,
    section: document.getElementById("section").value,
  };

  try {
    const response = await fetch("http://localhost:3000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(studentData)
    });

    const result = await response.json();
    console.log("✅ Server Response:", result); // just for testing

    if (response.ok && result.student) {
      alert("✅ Registration successful!");

      // Save data in localStorage
      localStorage.setItem("student", JSON.stringify(result.student));

      // Redirect
      window.location.href = "studentDashboard.html";
    } else {
      alert(result.error || "⚠ Registration failed!");
    }
  } catch (error) {
    console.error("Error during registration:", error);
    alert("❌ Failed to connect to server");
  }
});