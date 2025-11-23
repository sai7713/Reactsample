import { useState } from "react";
import { useNavigate } from "react-router-dom";

const initialValue = {
  firstname: '',
  lastname: '',
  email: '',
  password: '',
  mobile: '',
  alternatemobile: ''
}

const SubmitForm = () => {

  const [form, setForm] = useState(initialValue);
  const navigate = useNavigate();
  console.log(form);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form Submitted:", form);
    navigate("/success");
    setForm(initialValue);
  };

  return (
    <>
      <form
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "20px",
          textAlign: "center",
          flexDirection: "column",
          height: "100vh",
          backgroundColor: "#9b9292ff"
        }}
        target="_blank"
        onSubmit={handleSubmit}
      >
        <div>
          <h2>Registration Form</h2>
        </div>

        <div>
          <label>Firstname:</label>
          <input
            style={{ marginLeft: "5px" }}
            value={form.firstname}
            onChange={(e) => setForm({ ...form, firstname: e.target.value })}
            type="text"
            placeholder="Enter your first name..."
            required
          />
        </div>

        <div>
          <label>Lastname:</label>
          <input
            style={{ marginLeft: "5px" }}
            value={form.lastname}
            onChange={(e) => setForm({ ...form, lastname: e.target.value })}
            type="text"
            placeholder="Enter your last name..."
            required
          />
        </div>

        <div>
          <label>Email:</label>
          <input
            style={{ marginLeft: "5px" }}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            type="email"
            placeholder="Enter your email..."
            required
          />
        </div>

        <div>
          <label>Password:</label>
          <input
            style={{ marginLeft: "5px" }}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            type="password"
            placeholder="Enter your password..."
            required
          />
        </div>

        <div>
          <label>Mobile Number:</label>
          <input
            style={{ marginLeft: "5px" }}
            value={form.mobile}
            onChange={(e) => setForm({ ...form, mobile: e.target.value })}
            type="number"
            placeholder="Enter your mobile number..."
            required
          />
        </div>

        <div>
          <label>Alternate Mobile Number:</label>
          <input
            style={{ marginLeft: "5px" }}
            value={form.alternatemobile}
            onChange={(e) => setForm({ ...form, alternatemobile: e.target.value })}
            type="number"
            placeholder="Enter your alternate mobile number..."
          />
        </div>

        <div>
          <input type="submit" style={{ marginRight: "10px"}} />
          <input type="reset" onClick={() => setForm(initialValue)} />
        </div>
      </form>
    </>
  );
};

export default SubmitForm;