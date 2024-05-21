const catchAsyncError = require("../utils/catchAsyncError");
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const PlanModel = require("../models/planModel");
const UserModel = require("../models/userModel");

exports.createPaymentIntent = catchAsyncError(async (req, res, next) => {
    const product = req.body.product;
    const user = await UserModel.findById(product.userId);
    if (user.plan === null) {
        return res.status(400).json({ message: "Did'nt have any plan" });
    }
    if (!product) {
        return res.status(404).send({
            success: false,
            message: 'Product not found or not sent!'
        })
    } else {
        if (product.type === 'planPurchase' || user.plan_payment !== 'paid') {
            const planCost = await PlanModel.findOne({
                name: user.plan
            });
            const plan = planCost.phases.find(phase => phase.name === user.phase);
            try {
                const paymentIntent = await stripe.paymentIntents.create({
                    amount: plan.cost * 100,
                    currency: 'inr',
                    payment_method_types: ['card'],
                });
                res.status(200).send({
                    clientSecret: paymentIntent.client_secret,
                });
            } catch (error) {
                res.status(500).send({ error: error.message });
            }
        }
    }
});

exports.completedPayment = catchAsyncError(async (req, res, next) => {
});