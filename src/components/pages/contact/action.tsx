'use server';

import { prisma } from '@/lib/db';
import { z } from 'zod';

const contactSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  company: z.string().optional(),
  email: z.string().email('Email invalide'),
  phone: z.string().optional(),
  subjects: z.array(z.string()).min(1, 'Sélectionnez au moins un sujet'),
  message: z.string().optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;

export async function submitContactForm(data: ContactFormData) {
  try {
    // Validation avec Zod
    const validated = contactSchema.parse(data);

    // Insertion en base avec Prisma
    const submission = await prisma.contactSubmission.create({
      data: {
        firstName: validated.firstName,
        lastName: validated.lastName,
        company: validated.company,
        email: validated.email,
        phone: validated.phone,
        subjects: validated.subjects,
        message: validated.message,
      },
    });

    return { success: true, data: submission };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Données invalides',
        details: error.issues,
      };
    }

    console.error('Erreur lors de la soumission du formulaire:', error);
    return {
      success: false,
      error: "Une erreur est survenue lors de l'envoi du formulaire",
    };
  }
}