import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

interface EmailTemplateParams {
  documentName: string;
  documentLink: string;
  requesterName: string;
  approvalLink: string;
  rejectLink: string;
}

export async function sendApprovalRequestEmail(
  to: string,
  params: EmailTemplateParams
): Promise<boolean> {
  try {
    const msg = {
      to,
      from: 'noreply@yourdomain.com', // Replace with your verified sender
      subject: `Document Approval Request: ${params.documentName}`,
      html: `
        <h2>Document Approval Request</h2>
        <p>${params.requesterName} has requested your approval for document: ${params.documentName}</p>
        <p>You can review the document here: <a href="${params.documentLink}">View Document</a></p>
        <div style="margin: 20px 0;">
          <a href="${params.approvalLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; margin-right: 10px;">
            Approve
          </a>
          <a href="${params.rejectLink}" style="background-color: #f44336; color: white; padding: 10px 20px; text-decoration: none;">
            Reject
          </a>
        </div>
        <p>Or you can review the document in the system and approve/reject from there.</p>
      `,
    };

    await mailService.send(msg);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}
