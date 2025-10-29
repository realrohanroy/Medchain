// This file contains mock data for the MedChain application
// In a real app, this would be replaced with API calls to a backend service

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  password?: string;
  specialization?: string;
  hospital?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: string;
  walletAddress?: string;
  avatar?: string;
  wallet?: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId?: string;
  fileName: string;
  uploadDate: string;
  cid: string;
  tags: string[];
  sharedWith?: string[];
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  datetime: string;
  reason: string;
  status: 'Pending' | 'Accepted' | 'Cancelled' | 'Completed';
}

export interface AccessRequest {
  id: string;
  patientId: string;
  doctorId: string;
  requestDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reason: string;
}

// Mock users
const users: User[] = [
  {
    id: 'patient1',
    name: 'John Smith',
    email: 'john@example.com',
    password: 'password',
    role: 'patient',
    dateOfBirth: '1985-04-12',
    phoneNumber: '555-123-4567',
    address: '123 Main St, Anytown, USA',
    walletAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    avatar: '/avatars/patient1.jpg',
    wallet: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
  },
  {
    id: 'patient2',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    password: 'password',
    role: 'patient',
    dateOfBirth: '1990-07-23',
    phoneNumber: '555-987-6543',
    address: '456 Oak Ave, Somewhere, USA',
    walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    avatar: '/avatars/patient2.jpg',
    wallet: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
  },
  {
    id: 'doctor1',
    name: 'Dr. Michael Brown',
    email: 'michael@example.com',
    password: 'password',
    role: 'doctor',
    specialization: 'Cardiology',
    hospital: 'General Hospital',
    phoneNumber: '555-567-8901',
    walletAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    avatar: '/avatars/doctor1.jpg',
    wallet: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'
  },
  {
    id: 'doctor2',
    name: 'Dr. Emily Chen',
    email: 'emily@example.com',
    password: 'password',
    role: 'doctor',
    specialization: 'Neurology',
    hospital: 'City Medical Center',
    phoneNumber: '555-234-5678',
    walletAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    avatar: '/avatars/doctor2.jpg',
    wallet: '0x90F79bf6EB2c4f870365E785982E1f101E93b906'
  },
  // Additional Doctors with real names as requested
  {
    id: 'doctor3',
    name: 'Dr. Viraj Patil',
    email: 'viraj@example.com',
    password: 'password',
    role: 'doctor',
    specialization: 'General Medicine',
    hospital: 'City Hospital',
    phoneNumber: '555-123-7890',
    walletAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    avatar: '/avatars/doctor3.jpg',
    wallet: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
  },
  {
    id: 'doctor4',
    name: 'Dr. Rohan Sharma',
    email: 'rohan@example.com',
    password: 'password',
    role: 'doctor',
    specialization: 'Orthopedics',
    hospital: 'Memorial Hospital',
    phoneNumber: '555-456-7890',
    walletAddress: '0x4Fabb145d64652a948d72533023f6E7A623C7C53',
    avatar: '/avatars/doctor4.jpg',
    wallet: '0x4Fabb145d64652a948d72533023f6E7A623C7C53'
  },
  {
    id: 'doctor5',
    name: 'Dr. Aditya Kumar',
    email: 'aditya@example.com',
    password: 'password',
    role: 'doctor',
    specialization: 'Pediatrics',
    hospital: 'Children\'s Hospital',
    phoneNumber: '555-789-1234',
    walletAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    avatar: '/avatars/doctor5.jpg',
    wallet: '0xdAC17F958D2ee523a2206206994597C13D831ec7'
  },
  // Additional Patients
  {
    id: 'patient3',
    name: 'Robert Wilson',
    email: 'robert@example.com',
    password: 'password',
    role: 'patient',
    dateOfBirth: '1978-11-14',
    phoneNumber: '555-222-3333',
    address: '789 Pine St, Somewhere, USA',
    walletAddress: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
    avatar: '/avatars/default.jpg',
    wallet: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199'
  },
  {
    id: 'patient4',
    name: 'Emma Davis',
    email: 'emma@example.com',
    password: 'password',
    role: 'patient',
    dateOfBirth: '1992-03-29',
    phoneNumber: '555-444-5555',
    address: '101 Cedar Rd, Anytown, USA',
    walletAddress: '0x71bE63f3384f5fb98995898A86B02Fb2426c5788',
    avatar: '/avatars/default.jpg',
    wallet: '0x71bE63f3384f5fb98995898A86B02Fb2426c5788'
  },
  {
    id: 'patient5',
    name: 'James Miller',
    email: 'james@example.com',
    password: 'password',
    role: 'patient',
    dateOfBirth: '1982-08-05',
    phoneNumber: '555-666-7777',
    address: '202 Elm St, Anycity, USA',
    walletAddress: '0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097',
    avatar: '/avatars/default.jpg',
    wallet: '0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097'
  },
  {
    id: 'patient6',
    name: 'Sophia Martinez',
    email: 'sophia@example.com',
    password: 'password',
    role: 'patient',
    dateOfBirth: '1995-02-18',
    phoneNumber: '555-888-9999',
    address: '303 Maple Ave, Somewhere, USA',
    walletAddress: '0xFABB0ac9d68B0B445fB7357272Ff202C5651694a',
    avatar: '/avatars/default.jpg',
    wallet: '0xFABB0ac9d68B0B445fB7357272Ff202C5651694a'
  },
  {
    id: 'patient7',
    name: 'Michael Rodriguez',
    email: 'michaelr@example.com',
    password: 'password',
    role: 'patient',
    dateOfBirth: '1980-06-12',
    phoneNumber: '555-111-2222',
    address: '404 Birch Blvd, Anystate, USA',
    walletAddress: '0x1CBd3b2ec64e4682b2120631b50aD7c767568aB9',
    avatar: '/avatars/default.jpg',
    wallet: '0x1CBd3b2ec64e4682b2120631b50aD7c767568aB9'
  },
  {
    id: 'patient8',
    name: 'Olivia Thompson',
    email: 'olivia@example.com',
    password: 'password',
    role: 'patient',
    dateOfBirth: '1989-09-23',
    phoneNumber: '555-333-4444',
    address: '505 Walnut Dr, Anycity, USA',
    walletAddress: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
    avatar: '/avatars/default.jpg',
    wallet: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc'
  },
  {
    id: 'patient9',
    name: 'William Garcia',
    email: 'william@example.com',
    password: 'password',
    role: 'patient',
    dateOfBirth: '1975-12-08',
    phoneNumber: '555-555-6666',
    address: '606 Cedar St, Anytown, USA',
    walletAddress: '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
    avatar: '/avatars/default.jpg',
    wallet: '0x976EA74026E726554dB657fA54763abd0C3a0aa9'
  },
  {
    id: 'patient10',
    name: 'Ava Robinson',
    email: 'ava@example.com',
    password: 'password',
    role: 'patient',
    dateOfBirth: '1998-05-15',
    phoneNumber: '555-777-8888',
    address: '707 Pine Ave, Anycity, USA',
    walletAddress: '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955',
    avatar: '/avatars/default.jpg',
    wallet: '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955'
  },
  {
    id: 'patient11',
    name: 'Alexander Clark',
    email: 'alex@example.com',
    password: 'password',
    role: 'patient',
    dateOfBirth: '1988-02-28',
    phoneNumber: '555-999-0000',
    address: '808 Oak St, Anystate, USA',
    walletAddress: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    avatar: '/avatars/default.jpg',
    wallet: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65'
  },
  {
    id: 'patient12',
    name: 'Mia Lewis',
    email: 'mia@example.com',
    password: 'password',
    role: 'patient',
    dateOfBirth: '1993-10-03',
    phoneNumber: '555-000-1111',
    address: '909 Maple Blvd, Somewhere, USA',
    walletAddress: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4ef',
    avatar: '/avatars/default.jpg',
    wallet: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4ef'
  },
  {
    id: 'patient13',
    name: 'Ethan Walker',
    email: 'ethan@example.com',
    password: 'password',
    role: 'patient',
    dateOfBirth: '1979-07-19',
    phoneNumber: '555-222-3333',
    address: '111 Birch St, Anytown, USA',
    walletAddress: '0xbDA5747bFD65F08deb54cb465eB87D40e51B197E',
    avatar: '/avatars/default.jpg',
    wallet: '0xbDA5747bFD65F08deb54cb465eB87D40e51B197E'
  },
  {
    id: 'patient14',
    name: 'Charlotte Hall',
    email: 'charlotte@example.com',
    password: 'password',
    role: 'patient',
    dateOfBirth: '1994-04-22',
    phoneNumber: '555-444-5555',
    address: '222 Cedar Ave, Anycity, USA',
    walletAddress: '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f',
    avatar: '/avatars/default.jpg',
    wallet: '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f'
  },
  {
    id: 'patient15',
    name: 'Daniel Young',
    email: 'daniel@example.com',
    password: 'password',
    role: 'patient',
    dateOfBirth: '1984-11-10',
    phoneNumber: '555-666-7777',
    address: '333 Walnut Ave, Somewhere, USA',
    walletAddress: '0xcd3B766CCDd6AE721141F452C550Ca635964ce71',
    avatar: '/avatars/default.jpg',
    wallet: '0xcd3B766CCDd6AE721141F452C550Ca635964ce71'
  },
  {
    id: 'patient16',
    name: 'Amelia Allen',
    email: 'amelia@example.com',
    password: 'password',
    role: 'patient',
    dateOfBirth: '1997-08-25',
    phoneNumber: '555-888-9999',
    address: '444 Pine Dr, Anystate, USA',
    walletAddress: '0x2546BcD3c84621e976D8185a91A922aE77ECEc30',
    avatar: '/avatars/default.jpg',
    wallet: '0x2546BcD3c84621e976D8185a91A922aE77ECEc30'
  },
  {
    id: 'patient17',
    name: 'Matthew Scott',
    email: 'matthew@example.com',
    password: 'password',
    role: 'patient',
    dateOfBirth: '1981-03-17',
    phoneNumber: '555-111-2222',
    address: '555 Elm St, Anytown, USA',
    walletAddress: '0xBcd4042DE499D14e55001CcbB24a551F3b954096',
    avatar: '/avatars/default.jpg',
    wallet: '0xBcd4042DE499D14e55001CcbB24a551F3b954096'
  },
  {
    id: 'patient18',
    name: 'Harper Green',
    email: 'harper@example.com',
    password: 'password',
    role: 'patient',
    dateOfBirth: '1991-01-09',
    phoneNumber: '555-333-4444',
    address: '666 Maple St, Anycity, USA',
    walletAddress: '0x6b5bd6e9D9242A55F2129Da4E67C95bbCB65F7c0',
    avatar: '/avatars/default.jpg',
    wallet: '0x6b5bd6e9D9242A55F2129Da4E67C95bbCB65F7c0'
  },
  {
    id: 'patient19',
    name: 'Benjamin Adams',
    email: 'benjamin@example.com',
    password: 'password',
    role: 'patient',
    dateOfBirth: '1976-06-30',
    phoneNumber: '555-555-6666',
    address: '777 Oak Blvd, Somewhere, USA',
    walletAddress: '0x71C95911E9a5D330f4D621842EC243EE1343292e',
    avatar: '/avatars/default.jpg',
    wallet: '0x71C95911E9a5D330f4D621842EC243EE1343292e'
  },
  {
    id: 'patient20',
    name: 'Ella Baker',
    email: 'ella@example.com',
    password: 'password',
    role: 'patient',
    dateOfBirth: '1999-09-14',
    phoneNumber: '555-777-8888',
    address: '888 Cedar Dr, Anystate, USA',
    walletAddress: '0x16c9619F552C215B9564E28Ce5a646483e2C4D56',
    avatar: '/avatars/default.jpg',
    wallet: '0x16c9619F552C215B9564E28Ce5a646483e2C4D56'
  },
  {
    id: 'patient21',
    name: 'Henry Collins',
    email: 'henry@example.com',
    password: 'password',
    role: 'patient',
    dateOfBirth: '1987-05-08',
    phoneNumber: '555-999-0000',
    address: '999 Birch Ave, Anytown, USA',
    walletAddress: '0x8bFFda5B67A69e0217d8eFe6bf1cA916828CAF7c',
    avatar: '/avatars/default.jpg',
    wallet: '0x8bFFda5B67A69e0217d8eFe6bf1cA916828CAF7c'
  },
  {
    id: 'patient22',
    name: 'Victoria Turner',
    email: 'victoria@example.com',
    password: 'password',
    role: 'patient',
    dateOfBirth: '1995-12-21',
    phoneNumber: '555-000-1111',
    address: '123 Pine Ave, Anycity, USA',
    walletAddress: '0xF7d6c2fCc1aEB2B78c819b6fd58966308F513932',
    avatar: '/avatars/default.jpg',
    wallet: '0xF7d6c2fCc1aEB2B78c819b6fd58966308F513932'
  },
  {
    id: 'patient23',
    name: 'Sebastian Phillips',
    email: 'sebastian@example.com',
    password: 'password',
    role: 'patient',
    dateOfBirth: '1977-08-03',
    phoneNumber: '555-222-3333',
    address: '234 Maple Dr, Anystate, USA',
    walletAddress: '0x7A3a1c2De64f20EB5e916F40D11B01C441b2A8Dc',
    avatar: '/avatars/default.jpg',
    wallet: '0x7A3a1c2De64f20EB5e916F40D11B01C441b2A8Dc'
  },
  {
    id: 'patient24',
    name: 'Scarlett Campbell',
    email: 'scarlett@example.com',
    password: 'password',
    role: 'patient',
    dateOfBirth: '1992-02-14',
    phoneNumber: '555-444-5555',
    address: '345 Elm Ave, Somewhere, USA',
    walletAddress: '0x6Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb',
    avatar: '/avatars/default.jpg',
    wallet: '0x6Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb'
  },
  {
    id: 'patient25',
    name: 'Jackson Evans',
    email: 'jackson@example.com',
    password: 'password',
    role: 'patient',
    dateOfBirth: '1983-10-29',
    phoneNumber: '555-666-7777',
    address: '456 Oak Dr, Anycity, USA',
    walletAddress: '0xE5904695748fe4A84b40b3fc79De2277660BD1D3',
    avatar: '/avatars/default.jpg',
    wallet: '0xE5904695748fe4A84b40b3fc79De2277660BD1D3'
  },
  {
    id: 'patient26',
    name: 'Luna Harris',
    email: 'luna@example.com',
    password: 'password',
    role: 'patient',
    dateOfBirth: '1996-07-17',
    phoneNumber: '555-888-9999',
    address: '567 Walnut St, Anystate, USA',
    walletAddress: '0xec2742dA56c6E37b03A0B408D352C95d19878888',
    avatar: '/avatars/default.jpg',
    wallet: '0xec2742dA56c6E37b03A0B408D352C95d19878888'
  },
  {
    id: 'patient27',
    name: 'Leo Morgan',
    email: 'leo@example.com',
    password: 'password',
    role: 'patient',
    dateOfBirth: '1980-04-02',
    phoneNumber: '555-111-2222',
    address: '678 Cedar Ave, Anytown, USA',
    walletAddress: '0x92Dd5Cc559EedB8CE7E21F6734c0C8F4F00e61F6',
    avatar: '/avatars/default.jpg',
    wallet: '0x92Dd5Cc559EedB8CE7E21F6734c0C8F4F00e61F6'
  },
  {
    id: 'ansh123',
    name: 'Ansh Kumar',
    email: 'ansh@gmail.com',
    password: 'password',
    role: 'patient',
    dateOfBirth: '1990-05-15',
    phoneNumber: '555-123-9876',
    address: '123 Medical Lane, Health City, USA',
    walletAddress: '0xA123456789abcdef0123456789abcdef01234567',
    avatar: '/avatars/patient1.jpg',
    wallet: '0xA123456789abcdef0123456789abcdef01234567'
  },
];

// Mock medical records
const medicalRecords: MedicalRecord[] = [
  {
    id: 'record1',
    patientId: 'patient1',
    doctorId: 'doctor1',
    fileName: 'ECG_Results.pdf',
    uploadDate: '2025-03-15T10:30:00Z',
    cid: 'QmTgqnhFBMkfT9s8PHKcdXBn1Y1oH5qbGVT4LxA2XQ4bfU',
    tags: ['cardiology', 'ecg', 'heart'],
    sharedWith: ['doctor1', 'doctor2']
  },
  {
    id: 'record2',
    patientId: 'patient1',
    doctorId: 'doctor2',
    fileName: 'Blood_Test_Results.pdf',
    uploadDate: '2025-04-01T14:45:00Z',
    cid: 'QmUVkMQnj9xpq65kaNUYwXYRPUoLxNpzEqLd3LJYNUvFQ7',
    tags: ['blood test', 'routine', 'annual'],
    sharedWith: ['doctor2']
  },
  {
    id: 'record3',
    patientId: 'patient2',
    doctorId: 'doctor1',
    fileName: 'MRI_Scan.pdf',
    uploadDate: '2025-03-28T09:15:00Z',
    cid: 'QmVXdQJ5FTXZ8vkSBurbVcmH3NUWXMrBUcQxWBi7p1T9EK',
    tags: ['brain', 'mri', 'neurology'],
    sharedWith: ['doctor1']
  },
  {
    id: 'record4',
    patientId: 'patient2',
    doctorId: 'doctor2',
    fileName: 'Annual_Checkup.pdf',
    uploadDate: '2025-02-14T11:00:00Z',
    cid: 'QmYHQU5mhNkXKxdmwN8SdxEVvmrPqawFrBqKEMJ5LrDtnf',
    tags: ['annual', 'checkup', 'general'],
    sharedWith: []
  },
  {
    id: 'record5',
    patientId: 'patient3',
    doctorId: 'doctor1',
    fileName: 'Chest_Xray.pdf',
    uploadDate: '2025-04-03T10:30:00Z',
    cid: 'QmTgqnhFBMkfT9s8PHKcdXBn1Y1oH5qbGVT4LxA2XQ4bfV',
    tags: ['radiology', 'chest', 'xray'],
    sharedWith: ['doctor1']
  },
  {
    id: 'record6',
    patientId: 'patient3',
    doctorId: 'doctor2',
    fileName: 'Cholesterol_Test.pdf',
    uploadDate: '2025-03-27T15:45:00Z',
    cid: 'QmUVkMQnj9xpq65kaNUYwXYRPUoLxNpzEqLd3LJYNUvFQ8',
    tags: ['blood test', 'cholesterol', 'lipid panel'],
    sharedWith: ['doctor1', 'doctor2']
  },
  {
    id: 'record7',
    patientId: 'patient4',
    doctorId: 'doctor1',
    fileName: 'EEG_Results.pdf',
    uploadDate: '2025-04-05T09:15:00Z',
    cid: 'QmVXdQJ5FTXZ8vkSBurbVcmH3NUWXMrBUcQxWBi7p1T9EL',
    tags: ['neurology', 'eeg', 'brain'],
    sharedWith: ['doctor1']
  },
  {
    id: 'record8',
    patientId: 'patient4',
    doctorId: 'doctor2',
    fileName: 'Annual_Physical.pdf',
    uploadDate: '2025-01-20T11:00:00Z',
    cid: 'QmYHQU5mhNkXKxdmwN8SdxEVvmrPqawFrBqKEMJ5LrDtng',
    tags: ['annual', 'physical', 'general'],
    sharedWith: ['doctor2']
  },
  {
    id: 'record9',
    patientId: 'patient5',
    doctorId: 'doctor1',
    fileName: 'Cardiac_Stress_Test.pdf',
    uploadDate: '2025-03-18T14:30:00Z',
    cid: 'QmTgqnhFBMkfT9s8PHKcdXBn1Y1oH5qbGVT4LxA2XQ4bfW',
    tags: ['cardiology', 'stress test', 'heart'],
    sharedWith: ['doctor1']
  },
  {
    id: 'record10',
    patientId: 'patient5',
    doctorId: 'doctor2',
    fileName: 'Thyroid_Panel.pdf',
    uploadDate: '2025-02-27T09:45:00Z',
    cid: 'QmUVkMQnj9xpq65kaNUYwXYRPUoLxNpzEqLd3LJYNUvFQ9',
    tags: ['endocrinology', 'thyroid', 'hormone test'],
    sharedWith: ['doctor2']
  },
  {
    id: 'record11',
    patientId: 'patient6',
    doctorId: 'doctor1',
    fileName: 'Bone_Density_Scan.pdf',
    uploadDate: '2025-04-07T13:15:00Z',
    cid: 'QmVXdQJ5FTXZ8vkSBurbVcmH3NUWXMrBUcQxWBi7p1T9EM',
    tags: ['orthopedics', 'bone', 'dexa scan'],
    sharedWith: ['doctor1']
  },
  {
    id: 'record12',
    patientId: 'patient6',
    doctorId: 'doctor2',
    fileName: 'Gynecological_Exam.pdf',
    uploadDate: '2025-03-05T10:00:00Z',
    cid: 'QmYHQU5mhNkXKxdmwN8SdxEVvmrPqawFrBqKEMJ5LrDtnh',
    tags: ['gynecology', 'women health', 'pap smear'],
    sharedWith: ['doctor2']
  },
  {
    id: 'record13',
    patientId: 'patient7',
    doctorId: 'doctor1',
    fileName: 'Allergy_Testing.pdf',
    uploadDate: '2025-02-15T11:30:00Z',
    cid: 'QmTgqnhFBMkfT9s8PHKcdXBn1Y1oH5qbGVT4LxA2XQ4bfX',
    tags: ['allergy', 'immunology', 'skin test'],
    sharedWith: ['doctor1', 'doctor2']
  },
  {
    id: 'record14',
    patientId: 'patient7',
    doctorId: 'doctor2',
    fileName: 'Vision_Exam.pdf',
    uploadDate: '2025-01-10T14:45:00Z',
    cid: 'QmUVkMQnj9xpq65kaNUYwXYRPUoLxNpzEqLd3LJYNUvFR0',
    tags: ['ophthalmology', 'vision', 'eye exam'],
    sharedWith: ['doctor2']
  },
  {
    id: 'record15',
    patientId: 'patient8',
    doctorId: 'doctor1',
    fileName: 'Sleep_Study.pdf',
    uploadDate: '2025-03-22T20:15:00Z',
    cid: 'QmVXdQJ5FTXZ8vkSBurbVcmH3NUWXMrBUcQxWBi7p1T9EN',
    tags: ['neurology', 'sleep', 'apnea'],
    sharedWith: ['doctor1']
  },
  {
    id: 'record16',
    patientId: 'patient8',
    doctorId: 'doctor2',
    fileName: 'Audiogram.pdf',
    uploadDate: '2025-04-02T09:00:00Z',
    cid: 'QmYHQU5mhNkXKxdmwN8SdxEVvmrPqawFrBqKEMJ5LrDtni',
    tags: ['audiology', 'hearing', 'ear exam'],
    sharedWith: ['doctor2']
  },
  {
    id: 'record17',
    patientId: 'patient9',
    doctorId: 'doctor1',
    fileName: 'Colonoscopy_Report.pdf',
    uploadDate: '2025-01-28T08:30:00Z',
    cid: 'QmTgqnhFBMkfT9s8PHKcdXBn1Y1oH5qbGVT4LxA2XQ4bfY',
    tags: ['gastroenterology', 'colon', 'screening'],
    sharedWith: ['doctor1']
  },
  {
    id: 'record18',
    patientId: 'patient9',
    doctorId: 'doctor2',
    fileName: 'Prostate_Exam.pdf',
    uploadDate: '2025-03-17T13:45:00Z',
    cid: 'QmUVkMQnj9xpq65kaNUYwXYRPUoLxNpzEqLd3LJYNUvFR1',
    tags: ['urology', 'prostate', 'psa test'],
    sharedWith: ['doctor2']
  },
  {
    id: 'record19',
    patientId: 'patient10',
    doctorId: 'doctor1',
    fileName: 'Abdominal_Ultrasound.pdf',
    uploadDate: '2025-02-10T15:15:00Z',
    cid: 'QmVXdQJ5FTXZ8vkSBurbVcmH3NUWXMrBUcQxWBi7p1T9EO',
    tags: ['radiology', 'abdomen', 'ultrasound'],
    sharedWith: ['doctor1', 'doctor2']
  },
  {
    id: 'record20',
    patientId: 'patient10',
    doctorId: 'doctor2',
    fileName: 'Skin_Biopsy.pdf',
    uploadDate: '2025-04-08T10:00:00Z',
    cid: 'QmYHQU5mhNkXKxdmwN8SdxEVvmrPqawFrBqKEMJ5LrDtnj',
    tags: ['dermatology', 'skin', 'biopsy'],
    sharedWith: ['doctor2']
  },
  {
    id: 'record21',
    patientId: 'patient11',
    doctorId: 'doctor1',
    fileName: 'Joint_MRI.pdf',
    uploadDate: '2025-03-02T11:30:00Z',
    cid: 'QmTgqnhFBMkfT9s8PHKcdXBn1Y1oH5qbGVT4LxA2XQ4bfZ',
    tags: ['orthopedics', 'joint', 'mri'],
    sharedWith: ['doctor1']
  },
  {
    id: 'record22',
    patientId: 'patient11',
    doctorId: 'doctor2',
    fileName: 'Dental_Xrays.pdf',
    uploadDate: '2025-01-15T14:45:00Z',
    cid: 'QmUVkMQnj9xpq65kaNUYwXYRPUoLxNpzEqLd3LJYNUvFR2',
    tags: ['dental', 'teeth', 'xray'],
    sharedWith: ['doctor2']
  },
  {
    id: 'record23',
    patientId: 'patient12',
    doctorId: 'doctor1',
    fileName: 'Pulmonary_Function_Test.pdf',
    uploadDate: '2025-04-12T09:15:00Z',
    cid: 'QmVXdQJ5FTXZ8vkSBurbVcmH3NUWXMrBUcQxWBi7p1T9EP',
    tags: ['pulmonology', 'lung', 'spirometry'],
    sharedWith: ['doctor1']
  },
  {
    id: 'record24',
    patientId: 'patient12',
    doctorId: 'doctor2',
    fileName: 'Mammogram.pdf',
    uploadDate: '2025-02-20T13:00:00Z',
    cid: 'QmYHQU5mhNkXKxdmwN8SdxEVvmrPqawFrBqKEMJ5LrDtnk',
    tags: ['radiology', 'breast', 'cancer screening'],
    sharedWith: ['doctor2']
  },
  {
    id: 'record25',
    patientId: 'patient13',
    doctorId: 'doctor1',
    fileName: 'Kidney_Function_Test.pdf',
    uploadDate: '2025-03-08T10:30:00Z',
    cid: 'QmTgqnhFBMkfT9s8PHKcdXBn1Y1oH5qbGVT4LxA2XQ4bg0',
    tags: ['nephrology', 'kidney', 'creatinine'],
    sharedWith: ['doctor1', 'doctor2']
  },
  {
    id: 'record26',
    patientId: 'patient13',
    doctorId: 'doctor2',
    fileName: 'Nutrition_Assessment.pdf',
    uploadDate: '2025-01-25T16:45:00Z',
    cid: 'QmUVkMQnj9xpq65kaNUYwXYRPUoLxNpzEqLd3LJYNUvFR3',
    tags: ['nutrition', 'diet', 'assessment'],
    sharedWith: ['doctor2']
  },
  {
    id: 'record27',
    patientId: 'patient14',
    doctorId: 'doctor1',
    fileName: 'Spine_Xray.pdf',
    uploadDate: '2025-04-14T11:15:00Z',
    cid: 'QmVXdQJ5FTXZ8vkSBurbVcmH3NUWXMrBUcQxWBi7p1T9EQ',
    tags: ['orthopedics', 'spine', 'xray'],
    sharedWith: ['doctor1']
  },
  {
    id: 'record28',
    patientId: 'patient14',
    doctorId: 'doctor2',
    fileName: 'Physical_Therapy_Evaluation.pdf',
    uploadDate: '2025-03-10T13:00:00Z',
    cid: 'QmYHQU5mhNkXKxdmwN8SdxEVvmrPqawFrBqKEMJ5LrDtnl',
    tags: ['physical therapy', 'rehabilitation', 'evaluation'],
    sharedWith: ['doctor2']
  },
  {
    id: 'record29',
    patientId: 'patient15',
    doctorId: 'doctor1',
    fileName: 'Gastroscopy_Report.pdf',
    uploadDate: '2025-02-07T09:30:00Z',
    cid: 'QmTgqnhFBMkfT9s8PHKcdXBn1Y1oH5qbGVT4LxA2XQ4bg1',
    tags: ['gastroenterology', 'endoscopy', 'stomach'],
    sharedWith: ['doctor1']
  },
  {
    id: 'record30',
    patientId: 'patient15',
    doctorId: 'doctor2',
    fileName: 'Liver_Function_Test.pdf',
    uploadDate: '2025-04-20T14:45:00Z',
    cid: 'QmUVkMQnj9xpq65kaNUYwXYRPUoLxNpzEqLd3LJYNUvFR4',
    tags: ['hepatology', 'liver', 'enzyme test'],
    sharedWith: ['doctor2']
  },
  {
    id: 'record31',
    patientId: 'patient16',
    doctorId: 'doctor1',
    fileName: 'Hemoglobin_A1C_Test.pdf',
    uploadDate: '2025-03-15T15:15:00Z',
    cid: 'QmVXdQJ5FTXZ8vkSBurbVcmH3NUWXMrBUcQxWBi7p1T9ER',
    tags: ['endocrinology', 'diabetes', 'blood test'],
    sharedWith: ['doctor1', 'doctor2']
  },
  {
    id: 'record32',
    patientId: 'patient16',
    doctorId: 'doctor2',
    fileName: 'Mental_Health_Assessment.pdf',
    uploadDate: '2025-01-30T11:00:00Z',
    cid: 'QmYHQU5mhNkXKxdmwN8SdxEVvmrPqawFrBqKEMJ5LrDtnm',
    tags: ['psychiatry', 'mental health', 'assessment'],
    sharedWith: ['doctor2']
  },
  {
    id: 'record33',
    patientId: 'patient17',
    doctorId: 'doctor1',
    fileName: 'Genetic_Test.pdf',
    uploadDate: '2025-02-25T10:30:00Z',
    cid: 'QmTgqnhFBMkfT9s8PHKcdXBn1Y1oH5qbGVT4LxA2XQ4bg2',
    tags: ['genetics', 'dna', 'hereditary'],
    sharedWith: ['doctor1']
  },
  {
    id: 'record34',
    patientId: 'patient17',
    doctorId: 'doctor2',
    fileName: 'Carotid_Ultrasound.pdf',
    uploadDate: '2025-04-18T15:45:00Z',
    cid: 'QmUVkMQnj9xpq65kaNUYwXYRPUoLxNpzEqLd3LJYNUvFR5',
    tags: ['vascular', 'carotid', 'ultrasound'],
    sharedWith: ['doctor2']
  },
  {
    id: 'record35',
    patientId: 'patient18',
    doctorId: 'doctor1',
    fileName: 'Pelvic_Exam.pdf',
    uploadDate: '2025-03-12T09:15:00Z',
    cid: 'QmVXdQJ5FTXZ8vkSBurbVcmH3NUWXMrBUcQxWBi7p1T9ES',
    tags: ['gynecology', 'pelvic', 'exam'],
    sharedWith: ['doctor1']
  },
  {
    id: 'record36',
    patientId: 'patient18',
    doctorId: 'doctor2',
    fileName: 'Cardiac_CT_Scan.pdf',
    uploadDate: '2025-02-05T12:00:00Z',
    cid: 'QmYHQU5mhNkXKxdmwN8SdxEVvmrPqawFrBqKEMJ5LrDtnn',
    tags: ['cardiology', 'ct scan', 'heart'],
    sharedWith: ['doctor2']
  },
  {
    id: 'record37',
    patientId: 'patient19',
    doctorId: 'doctor1',
    fileName: 'Respiratory_Assessment.pdf',
    uploadDate: '2025-01-18T14:30:00Z',
    cid: 'QmTgqnhFBMkfT9s8PHKcdXBn1Y1oH5qbGVT4LxA2XQ4bg3',
    tags: ['pulmonology', 'respiratory', 'assessment'],
    sharedWith: ['doctor1', 'doctor2']
  },
  {
    id: 'record38',
    patientId: 'patient19',
    doctorId: 'doctor2',
    fileName: 'Orthopedic_Evaluation.pdf',
    uploadDate: '2025-04-22T10:45:00Z',
    cid: 'QmUVkMQnj9xpq65kaNUYwXYRPUoLxNpzEqLd3LJYNUvFR6',
    tags: ['orthopedics', 'joint', 'evaluation'],
    sharedWith: ['doctor2']
  },
  {
    id: 'record39',
    patientId: 'patient20',
    doctorId: 'doctor1',
    fileName: 'Hormone_Panel.pdf',
    uploadDate: '2025-03-20T11:15:00Z',
    cid: 'QmVXdQJ5FTXZ8vkSBurbVcmH3NUWXMrBUcQxWBi7p1T9ET',
    tags: ['endocrinology', 'hormone', 'panel'],
    sharedWith: ['doctor1']
  },
  {
    id: 'record40',
    patientId: 'patient20',
    doctorId: 'doctor2',
    fileName: 'Neurological_Evaluation.pdf',
    uploadDate: '2025-02-18T14:00:00Z',
    cid: 'QmYHQU5mhNkXKxdmwN8SdxEVvmrPqawFrBqKEMJ5LrDtno',
    tags: ['neurology', 'brain', 'evaluation'],
    sharedWith: ['doctor2']
  },
  {
    id: 'record41',
    patientId: 'patient21',
    doctorId: 'doctor1',
    fileName: 'Urinalysis.pdf',
    uploadDate: '2025-01-05T09:30:00Z',
    cid: 'QmTgqnhFBMkfT9s8PHKcdXBn1Y1oH5qbGVT4LxA2XQ4bg4',
    tags: ['urology', 'urine', 'test'],
    sharedWith: ['doctor1']
  },
  {
    id: 'record42',
    patientId: 'patient21',
    doctorId: 'doctor2',
    fileName: 'Vaccination_Record.pdf',
    uploadDate: '2025-04-24T13:45:00Z',
    cid: 'QmUVkMQnj9xpq65kaNUYwXYRPUoLxNpzEqLd3LJYNUvFR7',
    tags: ['immunization', 'vaccine', 'preventive'],
    sharedWith: ['doctor2']
  },
  {
    id: 'record43',
    patientId: 'patient22',
    doctorId: 'doctor1',
    fileName: 'Allergy_Panel.pdf',
    uploadDate: '2025-03-25T10:15:00Z',
    cid: 'QmVXdQJ5FTXZ8vkSBurbVcmH3NUWXMrBUcQxWBi7p1T9EU',
    tags: ['immunology', 'allergy', 'test'],
    sharedWith: ['doctor1', 'doctor2']
  },
  {
    id: 'record44',
    patientId: 'patient22',
    doctorId: 'doctor2',
    fileName: 'Rheumatology_Assessment.pdf',
    uploadDate: '2025-02-23T12:00:00Z',
    cid: 'QmYHQU5mhNkXKxdmwN8SdxEVvmrPqawFrBqKEMJ5LrDtnp',
    tags: ['rheumatology', 'autoimmune', 'assessment'],
    sharedWith: ['doctor2']
  },
];

// Mock notifications
export const notifications: Notification[] = [
  {
    id: 'notif1',
    userId: 'doctor1',
    message: 'New patient John Smith has requested an appointment',
    timestamp: '2025-04-20T08:30:00Z',
    read: false
  },
  {
    id: 'notif2',
    userId: 'doctor1',
    message: 'Sarah Johnson has shared new medical records with you',
    timestamp: '2025-04-19T15:00:00Z',
    read: true
  },
  {
    id: 'notif3',
    userId: 'doctor1',
    message: 'New access request from Michael Rodriguez',
    timestamp: '2025-04-18T14:25:00Z',
    read: false
  },
  {
    id: 'notif4',
    userId: 'doctor1',
    message: 'Appointment reminder: Olivia Thompson, tomorrow at 10:00 AM',
    timestamp: '2025-04-17T09:12:00Z',
    read: false
  },
  {
    id: 'notif5',
    userId: 'doctor1',
    message: 'William Garcia has uploaded new test results',
    timestamp: '2025-04-16T11:30:00Z',
    read: true
  }
];

// Mock appointments for users
const appointments: Appointment[] = [
  {
    id: 'apt1',
    patientId: 'patient1',
    doctorId: 'doctor1',
    datetime: '2025-04-21T10:00:00Z',
    reason: 'Annual checkup',
    status: 'Accepted'
  },
  {
    id: 'apt2',
    patientId: 'patient2',
    doctorId: 'doctor1',
    datetime: '2025-04-21T11:30:00Z',
    reason: 'Follow-up consultation',
    status: 'Accepted'
  },
  {
    id: 'apt3',
    patientId: 'patient3',
    doctorId: 'doctor1',
    datetime: '2025-04-21T14:00:00Z',
    reason: 'Initial consultation',
    status: 'Pending'
  },
  {
    id: 'apt4',
    patientId: 'patient4',
    doctorId: 'doctor1',
    datetime: '2025-04-22T09:15:00Z',
    reason: 'Cardiac evaluation',
    status: 'Accepted'
  },
  {
    id: 'apt5',
    patientId: 'patient5',
    doctorId: 'doctor1',
    datetime: '2025-04-22T11:00:00Z',
    reason: 'Blood pressure check',
    status: 'Accepted'
  },
  {
    id: 'apt6',
    patientId: 'patient6',
    doctorId: 'doctor2',
    datetime: '2025-04-23T10:00:00Z',
    reason: 'Neurological assessment',
    status: 'Accepted'
  },
  {
    id: 'apt7',
    patientId: 'patient7',
    doctorId: 'doctor2',
    datetime: '2025-04-23T11:30:00Z',
    reason: 'Follow-up consultation',
    status: 'Accepted'
  },
  {
    id: 'apt8',
    patientId: 'patient8',
    doctorId: 'doctor2',
    datetime: '2025-04-23T14:00:00Z',
    reason: 'Initial consultation',
    status: 'Pending'
  },
  {
    id: 'apt9',
    patientId: 'patient9',
    doctorId: 'doctor2',
    datetime: '2025-04-24T09:15:00Z',
    reason: 'MRI review',
    status: 'Accepted'
  },
  {
    id: 'apt10',
    patientId: 'patient10',
    doctorId: 'doctor2',
    datetime: '2025-04-24T11:00:00Z',
    reason: 'Headache consultation',
    status: 'Accepted'
  }
];

// Mock access requests for medical records
const accessRequests: AccessRequest[] = [
  {
    id: 'req1',
    patientId: 'patient1',
    doctorId: 'doctor1',
    requestDate: '2025-04-20',
    status: 'Pending',
    reason: 'Need access to medical history for consultation'
  },
  {
    id: 'req2',
    patientId: 'patient2',
    doctorId: 'doctor1',
    requestDate: '2025-04-19',
    status: 'Approved',
    reason: 'Access to previous lab results'
  },
  {
    id: 'req3',
    patientId: 'patient3',
    doctorId: 'doctor1',
    requestDate: '2025-04-18',
    status: 'Rejected',
    reason: 'Need to check previous treatments'
  },
  {
    id: 'req4',
    patientId: 'patient4',
    doctorId: 'doctor1',
    requestDate: '2025-04-17',
    status: 'Pending',
    reason: 'Access to cardiac records'
  },
  {
    id: 'req5',
    patientId: 'patient5',
    doctorId: 'doctor1',
    requestDate: '2025-04-16',
    status: 'Approved',
    reason: 'Review previous medications'
  },
  {
    id: 'req6',
    patientId: 'patient6',
    doctorId: 'doctor2',
    requestDate: '2025-04-20',
    status: 'Approved',
    reason: 'Need access to neurological history'
  },
  {
    id: 'req7',
    patientId: 'patient7',
    doctorId: 'doctor2',
    requestDate: '2025-04-19',
    status: 'Approved',
    reason: 'Access to previous MRI results'
  },
  {
    id: 'req8',
    patientId: 'patient8',
    doctorId: 'doctor2',
    requestDate: '2025-04-18',
    status: 'Pending',
    reason: 'Need to check previous neurological treatments'
  },
  {
    id: 'req9',
    patientId: 'patient9',
    doctorId: 'doctor2',
    requestDate: '2025-04-17',
    status: 'Approved',
    reason: 'Access to brain scan records'
  },
  {
    id: 'req10',
    patientId: 'patient10',
    doctorId: 'doctor2',
    requestDate: '2025-04-16',
    status: 'Approved',
    reason: 'Review previous medications and treatments'
  }
];

// Helper functions to query this data
export const findUserById = (id: string): User | User[] | null => {
  if (id === 'all') {
    return users;
  }
  return users.find(user => user.id === id) || null;
};

export const findUserByEmail = (email: string): User | User[] | null => {
  if (email === 'all') {
    return users;
  }
  return users.find(user => user.email === email) || null;
};

// Helper function to safely get properties from User | User[] | null
export const safeUser = (user: User | User[] | null): User | null => {
  if (!user) return null;
  if (Array.isArray(user)) return null;
  return user;
};

export const getUserMedicalRecords = (userId: string): MedicalRecord[] => {
  if (users.find(u => u.id === userId)?.role === 'doctor') {
    // For doctors, return records shared with them
    return medicalRecords.filter(record => 
      record.sharedWith?.includes(userId)
    );
  } else {
    // For patients, return their own records
    return medicalRecords.filter(record => 
      record.patientId === userId
    );
  }
};

// New helper functions for appointments and access requests
export const getUserAppointments = (userId: string): Appointment[] => {
  return appointments.filter(apt => apt.doctorId === userId);
};

export const getUserNotifications = (userId: string): Notification[] => {
  return notifications.filter(notif => notif.userId === userId);
};

export const getUserAccessRequests = (userId: string): AccessRequest[] => {
  return accessRequests.filter(req => req.doctorId === userId);
};

export const getDoctorPatients = (doctorId: string): User[] => {
  // Get all patients who have appointments with this doctor
  // or have granted access to this doctor
  const patientIds = new Set([
    ...appointments
      .filter(apt => apt.doctorId === doctorId)
      .map(apt => apt.patientId),
    ...accessRequests
      .filter(req => req.doctorId === doctorId && req.status === 'Approved')
      .map(req => req.patientId)
  ]);
  
  return users.filter(user => 
    user.role === 'patient' && patientIds.has(user.id)
  );
};
