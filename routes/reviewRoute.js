const router = require("express").Router();

// controllers
const { createReview, updateReview, deleteReview, getByReviewId, getAllReviews } = require("../controllers/reviewCtrl");

//validation middlewares
const { reviewValidator } = require("../Validators/reviews/reviewValidator");

router.post("/", reviewValidator, createReview);
router.put("/:id", reviewValidator, updateReview);
router.delete("/:id", deleteReview);

// can do all users
router.get("/", getAllReviews);
router.get("/:id", getByReviewId);

module.exports = router;