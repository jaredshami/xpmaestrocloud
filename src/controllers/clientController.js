const { PrismaClient } = require('@prisma/client');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { generateCustomerId } = require('../utils/subdomainGenerator');

const prisma = new PrismaClient();

exports.createClient = async (req, res, next) => {
  try {
    const { name, email, phone, company } = req.body;

    if (!name || !email) {
      throw new ValidationError('Name and email are required');
    }

    const customerId = generateCustomerId();

    const client = await prisma.client.create({
      data: {
        customerId,
        name,
        email,
        phone: phone || null,
        company: company || null,
      },
    });

    res.status(201).json(client);
  } catch (error) {
    next(error);
  }
};

exports.getAllClients = async (req, res, next) => {
  try {
    const clients = await prisma.client.findMany({
      include: {
        instances: true,
      },
    });

    res.json(clients);
  } catch (error) {
    next(error);
  }
};

exports.getClientById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const client = await prisma.client.findUnique({
      where: { id: parseInt(id) },
      include: {
        instances: true,
      },
    });

    if (!client) {
      throw new NotFoundError('Client not found');
    }

    res.json(client);
  } catch (error) {
    next(error);
  }
};

exports.updateClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, phone, company } = req.body;

    const client = await prisma.client.update({
      where: { id: parseInt(id) },
      data: {
        name: name || undefined,
        email: email || undefined,
        phone: phone || undefined,
        company: company || undefined,
      },
    });

    res.json(client);
  } catch (error) {
    next(error);
  }
};

exports.deleteClient = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Delete related instances first
    await prisma.instance.deleteMany({
      where: { clientId: parseInt(id) },
    });

    // Delete client
    const client = await prisma.client.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: 'Client deleted successfully', client });
  } catch (error) {
    next(error);
  }
};
