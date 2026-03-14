import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
import Medication from './models/Medication.js';
import Reminder from './models/Reminder.js';

dotenv.config();

const testDatabase = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ MongoDB connected successfully!');
    console.log('📊 Database:', mongoose.connection.name);

    // Test 1: Create a sample user
    console.log('\n📝 Creating sample user...');
    const user = await User.create({
      name: 'John Doe',
      email: `test.user.${Date.now()}@example.com`,
      password: 'testPassword123',
      phone: '+1-555-0123',
      age: 35,
      sleepSchedule: {
        wakeTime: '07:00',
        sleepTime: '23:00',
      },
      healthConditions: ['Hypertension', 'Diabetes'],
    });

    console.log('✅ User created:');
    console.log(`   ID: ${user._id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);

    // Test 2: Create a sample medication
    console.log('\n💊 Creating sample medication...');
    const medication = await Medication.create({
      userId: user._id,
      name: 'Lisinopril',
      dosage: '10mg',
      frequency: 'once daily',
      reason: 'Hypertension management',
      sideEffects: ['Dizziness', 'Dry cough'],
      interactions: ['NSAIDs', 'Potassium supplements'],
      prescribedDate: new Date(),
      status: 'active',
    });

    console.log('✅ Medication created:');
    console.log(`   ID: ${medication._id}`);
    console.log(`   Name: ${medication.name}`);
    console.log(`   Dosage: ${medication.dosage}`);
    console.log(`   Frequency: ${medication.frequency}`);

    // Test 3: Create a sample reminder
    console.log('\n🔔 Creating sample reminder...');
    const reminder = await Reminder.create({
      userId: user._id,
      medicationId: medication._id,
      time: '09:00',
      daysOfWeek: [1, 3, 5], // Monday, Wednesday, Friday
      description: 'Take Lisinopril with breakfast',
      isCompleted: false,
      status: 'active',
    });

    console.log('✅ Reminder created:');
    console.log(`   ID: ${reminder._id}`);
    console.log(`   Time: ${reminder.time}`);
    console.log(`   Days: Monday, Wednesday, Friday`);

    // Test 4: Verify data retrieval
    console.log('\n📂 Verifying data retrieval...');
    const fetchedUser = await User.findById(user._id).select('-password');
    const fetchedMedications = await Medication.find({ userId: user._id });
    const fetchedReminders = await Reminder.find({ userId: user._id }).populate('medicationId');

    console.log(`✅ Retrieved ${fetchedMedications.length} medication(s) for user`);
    console.log(`✅ Retrieved ${fetchedReminders.length} reminder(s) for user`);

    console.log('\n🎉 Database test completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   User ID: ${user._id}`);
    console.log(`   Medication ID: ${medication._id}`);
    console.log(`   Reminder ID: ${reminder._id}`);

    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

testDatabase();
