const passengerOnly = (
  req,
  res,
  next
) => {
  if (!req.user) {
    return res.status(401).json({
      message:
        "Authentication required",
    });
  }

  if (
    req.user.role !== "passenger"
  ) {
    return res.status(403).json({
      message:
        "Passenger access required",
    });
  }

  next();
};

module.exports = passengerOnly;