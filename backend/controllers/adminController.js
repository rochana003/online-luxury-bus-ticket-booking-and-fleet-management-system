const User = require("../models/User");

// Fetch profile of the logged-in administrator
const getAdminProfile = async (req, res) => {
  try {
    const admin = await User.findById(req.user.userId).select("-password");
    if (!admin) {
      return res.status(404).json({ message: "Admin user not found" });
    }

    return res.status(200).json({ admin });
  } catch (error) {
    console.error("Admin profile error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAdminProfile,
};
