const catchAsyncError = require("../utils/catchAsyncError");
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const PlanModel = require("../models/planModel");

exports.createPaymentIntent = catchAsyncError(async (req, res, next) => {
    const product = req.body;

    if (!product) {
        return res.status(404).send({
            success: false,
            message: 'Product not found or not sent!'
        })
    } else {
        if (product.type === 'planPurchase') {
            const planCost = await PlanModel.findOne({
                name: product.name
            });
            const plan = planCost.phases.find(phase => phase.name === product.phase);
            try {
                const paymentIntent = await stripe.paymentIntents.create({
                    amount: plan.cost * 100,
                    currency: 'usd',
                    payment_method_types: ['card', 'us_bank_account', 'afterpay_clearpay', 'apple_pay', 'google_pay'],
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

exports.capturePayment = catchAsyncError(async (req, res, next) => {

    const { session_id } = req.query;

    const session = await stripe.checkout.sessions.retrieve(session_id);
    const paymentStatus = session.payment_status;
});