
import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import nodemailer from "nodemailer";

const app = express();
dotenv.config();
app.set("view engine", "ejs");
app.set("views", "./views");
app.use(bodyParser.urlencoded({ extended: true }));

var currentRecipe = {};
app.get("/", (req, res) => {
    res.render("home");
});

app.post("/search", async (req, res) => {
    const { minProtein, maxProtein, minCarbs, maxCarbs, maxFat, diet, include } = req.body;

    // Base URL for the Spoonacular API
    const baseUrl = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${process.env.SPOONOCULAR}`;

    // Initialize the query string with the base URL
    let queryString = baseUrl;

    // Append query parameters
    if (minProtein) queryString += `&minProtein=${minProtein}`;
    if (maxProtein) queryString += `&maxProtein=${maxProtein}`;
    if (minCarbs) queryString += `&minCarbs=${minCarbs}`;
    if (maxCarbs) queryString += `&maxCarbs=${maxCarbs}`;
    if (maxFat) queryString += `&maxFat=${maxFat}`;
    if (diet) queryString += `&diet=${diet}`;
    if (include) queryString += `&includeIngredients=${include}`;

    try {
        const response = await axios.get(queryString);
        console.log("Recipes data:", response.data); // Log data for debugging
        
        res.render("searched", { recipe: response.data });
    } catch (error) {
        console.error("Error fetching recipes:", error.message);
        res.status(500).send("An error occurred while fetching the recipes.");
    }
});

app.get("/recipe/:id", async (req, res) => {
    const recipeId = req.params.id;
    const detailUrl = `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${process.env.SPOONOCULAR}`;
    const emailSuccess = req.query.emailSuccess;
    try {
        const response = await axios.get(detailUrl);
        console.log("Recipe details data:", response.data); // Log data for debugging
        currentRecipe = response.data;
        res.render("recipe", { recipe: currentRecipe, emailSuccess: emailSuccess});
    } catch (error) {
        console.error("Error fetching recipe details:", error.message);
        res.status(500).send("An error occurred while fetching the recipe details. Please try again later.");
    }
});

app.post("/email-recipe", async (req, res) => {
    const { email, title, summary, image, ingredients, instructions } = req.body;

    // Use nodemailer (or EmailJS) to send the email
    const transporter = nodemailer.createTransport({
        service: 'hotmail', // You can use your preferred email service or SMTP
        auth: {
            user: process.env.HOTMAIL_USERNAME, // Your email
            pass: process.env.HOTMAIL_PASSWORD // Your email password (or app-specific password)
        }
    });

    // Compose the email
    const mailOptions = {
        from: process.env.HOTMAIL_USERNAME,
        to: email,
        subject: `Recipe: ${title}`,
        html: `
          <h1>${title}</h1>
          <img src="${image}" alt="${title}" style="width: 100%; max-width: 400px;">
          <p>${summary}</p>
          <h2>Ingredients:</h2>
          <ul>
            ${JSON.parse(ingredients).map(ingredient => `<li>${ingredient}</li>`).join('')}
          </ul>
          <h2>Instructions:</h2>
          <p>${instructions}</p>
        `
    };

    try {
        // Send the email
        await transporter.sendMail(mailOptions);
        console.log(`Recipe sent to ${email}`);

        // Redirect or reload the recipe page after email is sent
        res.redirect(`/recipe/${currentRecipe.id}?emailSuccess=true`);
    } catch (error) {
        console.error("Error sending email:", error.message);
        res.status(500).send("Failed to send email. Please try again.");
    }
});


app.listen(3000, () => {
    console.log("listening on port 3000");
});
