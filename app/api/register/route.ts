import { randomBytes, randomUUID } from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { receiptObjectKey, s3BucketName, s3Client } from "@/lib/s3";

export const runtime = "nodejs";

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function cleanFileName(fileName: string) {
  const cleaned = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");

  if (cleaned.length <= 110) {
    return cleaned;
  }

  const extensionIndex = cleaned.lastIndexOf(".");
  const extension = extensionIndex > -1 ? cleaned.slice(extensionIndex) : "";
  const baseName = extensionIndex > -1 ? cleaned.slice(0, extensionIndex) : cleaned;

  return `${baseName.slice(0, 110 - extension.length)}${extension}`;
}

function createReferenceId() {
  return `CHEFS-2026-${randomBytes(4).toString("hex").toUpperCase()}`;
}

function s3ErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return `Unable to upload the receipt to S3. AWS error: ${error.name}.`;
  }

  return "Unable to upload the receipt to S3. Please check the S3 credentials and bucket permissions.";
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const firstName = field(formData, "firstName");
  const surname = field(formData, "surname");
  const gender = field(formData, "gender");
  const mobileNumber = field(formData, "mobileNumber");
  const studentId = field(formData, "studentId");
  const studentEmail = field(formData, "studentEmail");
  const feeStatus = field(formData, "feeStatus");
  const helpLoanAmount = field(formData, "helpLoanAmount");
  const consent = field(formData, "consent");
  const receipt = formData.get("feeReceipt");

  if (
    !firstName ||
    !surname ||
    !gender ||
    !mobileNumber ||
    !studentId ||
    !studentEmail ||
    !feeStatus ||
    consent !== "on"
  ) {
    return NextResponse.json(
      { message: "Please complete all required fields." },
      { status: 400 },
    );
  }

  if (!["yes", "no", "help"].includes(feeStatus)) {
    return NextResponse.json(
      { message: "Please select a valid fee status." },
      { status: 400 },
    );
  }

  if (feeStatus === "help" && !helpLoanAmount) {
    return NextResponse.json(
      { message: "Please enter the HELP loan amount." },
      { status: 400 },
    );
  }

  const normalizedHelpLoanAmount =
    feeStatus === "help" ? Number(helpLoanAmount) : null;

  if (
    feeStatus === "help" &&
    (normalizedHelpLoanAmount === null || Number.isNaN(normalizedHelpLoanAmount))
  ) {
    return NextResponse.json(
      { message: "Please enter a valid HELP loan amount." },
      { status: 400 },
    );
  }

  if (
    feeStatus === "no" &&
    (typeof receipt === "string" || !receipt || receipt.size === 0)
  ) {
    return NextResponse.json(
      { message: "Please upload the remaining school fee receipt." },
      { status: 400 },
    );
  }

  const existingRegistration = await prisma.registration.findUnique({
    where: {
      studentId,
    },
    select: {
      referenceId: true,
    },
  });

  if (existingRegistration) {
    return NextResponse.json(
      {
        message: `This student ID is already registered. Reference ID: ${existingRegistration.referenceId}`,
      },
      { status: 409 },
    );
  }

  const id = randomUUID();
  const referenceId = createReferenceId();
  let receiptStoragePath: string | null = null;
  let receiptFileName: string | null = null;
  let receiptContentType: string | null = null;

  if (feeStatus === "no" && receipt && typeof receipt !== "string") {
    receiptFileName = receipt.name || "receipt";
    receiptContentType = receipt.type || "application/octet-stream";
    const fileName = `${referenceId}-${cleanFileName(receiptFileName)}`;
    receiptStoragePath = receiptObjectKey(fileName);
    const buffer = Buffer.from(await receipt.arrayBuffer());

    try {
      await s3Client().send(
        new PutObjectCommand({
          Bucket: s3BucketName(),
          Key: receiptStoragePath,
          Body: buffer,
          ContentType: receiptContentType,
          Metadata: {
            registrationId: id,
            originalFileName: receiptFileName,
          },
        }),
      );
    } catch (error) {
      console.error("Unable to upload receipt to S3", error);

      return NextResponse.json(
        { message: s3ErrorMessage(error) },
        { status: 500 },
      );
    }
  }

  try {
    await prisma.registration.create({
      data: {
        id,
        referenceId,
        firstName,
        surname,
        gender,
        mobileNumber,
        studentId,
        studentEmail,
        feeStatus,
        helpLoanAmount: normalizedHelpLoanAmount,
        receiptStoragePath,
        receiptFileName,
        receiptContentType,
        consentAccepted: true,
      },
    });
  } catch (error) {
    console.error("Unable to save registration", error);

    return NextResponse.json(
      { message: "Unable to save registration. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    id,
    referenceId,
    message: "Registration saved successfully.",
  });
}
