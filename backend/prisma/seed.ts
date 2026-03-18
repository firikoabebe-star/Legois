import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default roles
  const ownerRole = await prisma.role.upsert({
    where: { name: 'owner' },
    update: {},
    create: {
      name: 'owner',
      description: 'Full access to workspace',
      canCreatePages: true,
      canEditPages: true,
      canDeletePages: true,
      canInviteMembers: true,
      canManageMembers: true,
      canManageSettings: true,
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Administrative access',
      canCreatePages: true,
      canEditPages: true,
      canDeletePages: true,
      canInviteMembers: true,
      canManageMembers: true,
      canManageSettings: false,
    },
  });

  const memberRole = await prisma.role.upsert({
    where: { name: 'member' },
    update: {},
    create: {
      name: 'member',
      description: 'Standard member access',
      canCreatePages: true,
      canEditPages: true,
      canDeletePages: false,
      canInviteMembers: false,
      canManageMembers: false,
      canManageSettings: false,
    },
  });

  const guestRole = await prisma.role.upsert({
    where: { name: 'guest' },
    update: {},
    create: {
      name: 'guest',
      description: 'Limited guest access',
      canCreatePages: false,
      canEditPages: false,
      canDeletePages: false,
      canInviteMembers: false,
      canManageMembers: false,
      canManageSettings: false,
    },
  });

  // Create demo user
  const hashedPassword = await bcrypt.hash('demo123', 10);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      username: 'demo',
      firstName: 'Demo',
      lastName: 'User',
      password: hashedPassword,
      emailVerified: true,
    },
  });

  // Create demo workspace
  const demoWorkspace = await prisma.workspace.upsert({
    where: { id: 'demo-workspace' },
    update: {},
    create: {
      id: 'demo-workspace',
      name: 'Demo Workspace',
      description: 'A sample workspace for testing',
      icon: '🚀',
      creatorId: demoUser.id,
    },
  });

  // Add demo user as owner of demo workspace
  await prisma.workspaceMember.upsert({
    where: {
      userId_workspaceId: {
        userId: demoUser.id,
        workspaceId: demoWorkspace.id,
      },
    },
    update: {},
    create: {
      userId: demoUser.id,
      workspaceId: demoWorkspace.id,
      roleId: ownerRole.id,
    },
  });

  // Create sample pages
  const welcomePage = await prisma.page.create({
    data: {
      title: 'Welcome to Your Workspace',
      icon: '👋',
      workspaceId: demoWorkspace.id,
      creatorId: demoUser.id,
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Welcome to your new workspace! This is where you can create pages, collaborate with your team, and organize your work.',
              },
            ],
          },
        ],
      },
    },
  });

  const gettingStartedPage = await prisma.page.create({
    data: {
      title: 'Getting Started',
      icon: '📚',
      workspaceId: demoWorkspace.id,
      creatorId: demoUser.id,
      parentId: welcomePage.id,
      content: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Quick Start Guide' }],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Here are some tips to get you started with your workspace.',
              },
            ],
          },
        ],
      },
    },
  });

  // Create sample blocks for the welcome page
  await prisma.block.createMany({
    data: [
      {
        type: 'heading',
        content: {
          level: 1,
          text: 'Welcome to Your Workspace',
        },
        position: 0,
        pageId: welcomePage.id,
        creatorId: demoUser.id,
      },
      {
        type: 'text',
        content: {
          text: 'This is your first page. You can edit this content, add new blocks, and create a knowledge base for your team.',
        },
        position: 1,
        pageId: welcomePage.id,
        creatorId: demoUser.id,
      },
      {
        type: 'heading',
        content: {
          level: 2,
          text: 'What you can do here:',
        },
        position: 2,
        pageId: welcomePage.id,
        creatorId: demoUser.id,
      },
      {
        type: 'list',
        content: {
          type: 'bullet',
          items: [
            'Create and organize pages',
            'Build databases and tables',
            'Collaborate with your team',
            'Add comments and feedback',
            'Share pages publicly',
          ],
        },
        position: 3,
        pageId: welcomePage.id,
        creatorId: demoUser.id,
      },
    ],
  });

  // Create sample database
  const projectsDatabase = await prisma.database.create({
    data: {
      name: 'Projects',
      description: 'Track your team projects',
      icon: '📋',
      workspaceId: demoWorkspace.id,
    },
  });

  // Create database properties
  const nameProperty = await prisma.databaseProperty.create({
    data: {
      name: 'Name',
      type: 'text',
      position: 0,
      databaseId: projectsDatabase.id,
    },
  });

  const statusProperty = await prisma.databaseProperty.create({
    data: {
      name: 'Status',
      type: 'select',
      position: 1,
      databaseId: projectsDatabase.id,
      options: {
        options: [
          { id: '1', name: 'Not Started', color: 'gray' },
          { id: '2', name: 'In Progress', color: 'blue' },
          { id: '3', name: 'Completed', color: 'green' },
        ],
      },
    },
  });

  const dueDateProperty = await prisma.databaseProperty.create({
    data: {
      name: 'Due Date',
      type: 'date',
      position: 2,
      databaseId: projectsDatabase.id,
    },
  });

  // Create sample database rows
  const sampleRow = await prisma.databaseRow.create({
    data: {
      position: 0,
      databaseId: projectsDatabase.id,
    },
  });

  // Add values to the sample row
  await prisma.databaseValue.createMany({
    data: [
      {
        rowId: sampleRow.id,
        propertyId: nameProperty.id,
        value: { text: 'Launch Marketing Campaign' },
      },
      {
        rowId: sampleRow.id,
        propertyId: statusProperty.id,
        value: { select: { id: '2', name: 'In Progress', color: 'blue' } },
      },
      {
        rowId: sampleRow.id,
        propertyId: dueDateProperty.id,
        value: { date: '2024-12-31' },
      },
    ],
  });

  // Create default database view
  await prisma.databaseView.create({
    data: {
      name: 'All Projects',
      type: 'table',
      isDefault: true,
      databaseId: projectsDatabase.id,
      config: {
        filters: [],
        sorts: [{ property: nameProperty.id, direction: 'asc' }],
        groupBy: null,
      },
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log(`👤 Demo user: demo@example.com / demo123`);
  console.log(`🏢 Demo workspace: ${demoWorkspace.name}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });