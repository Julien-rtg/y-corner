import { api } from '@/lib/api';

export interface ContactFormData {
  subject: string;
  message: string;
  email?: string;
  name?: string;
}

export interface ContactResponse {
  message: string;
}

/**
 * Sends a contact form message to the backend
 * @param data The contact form data
 * @param files Optional files to attach to the message
 * @returns Promise with the response from the server
 */
export async function sendContactMessage(data: ContactFormData, files?: File[]): Promise<ContactResponse> {
  // If there are no files, we can send a simple JSON request
  if (!files || files.length === 0) {
    return api<ContactResponse>('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
    import.meta.env.VITE_API_URL || ""
  );
  }

  // If there are files, we need to use FormData
  const formData = new FormData();
  
  // Add the form data
  formData.append('subject', data.subject);
  formData.append('message', data.message);
  
  if (data.email) {
    formData.append('email', data.email);
  }
  
  if (data.name) {
    formData.append('name', data.name);
  }
  
  // Add the files with explicit file names
  files.forEach((file) => {
    formData.append('files[]', file, file.name);
  });

  return api<ContactResponse>('/api/contact', {
    method: 'POST',
    body: formData,
  },
    import.meta.env.VITE_API_URL || "");
}
