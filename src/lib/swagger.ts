import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Minha API",
      version: "1.0.0",
      description: "Documentação da API com Swagger",
    },
  },
  apis: ["./pages/api/*.js"], // onde estão suas rotas
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;