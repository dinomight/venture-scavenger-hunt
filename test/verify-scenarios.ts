import { client } from '../lib/db';
import { ensureSchema } from '../lib/db/init';
import { getAllYears, getYearByNumber, createYearSession, updateYearSettings } from '../lib/actions/years';
import { getTargetsForYear, createTarget, bulkImportTargets, deleteTarget } from '../lib/actions/targets';
import { createSubmissionAction, deleteSubmissionAction } from '../lib/actions/submissions';
import { getRankMilestone } from '../lib/utils/rank-titles';
import { validateAdminPin } from '../lib/session';

async function runTests() {
  console.log('--- STARTING VERIFICATION TESTS ---');

  // 1. Ensure DB schema
  console.log('1. Testing DB schema initialization...');
  await ensureSchema(client);
  const yearsList = await getAllYears();
  if (yearsList.length === 0) throw new Error('Schema init failed: no years found');
  console.log(`✓ Initialized DB with ${yearsList.length} year(s). Default year: ${yearsList[0].year}`);

  // 2. Validate Year Retrieval and Session Details
  console.log('2. Testing Year Retrieval & Join Code...');
  const year2026 = await getYearByNumber(2026);
  if (!year2026 || year2026.joinCode !== 'VENTURE26') {
    throw new Error('Year 2026 lookup or join code mismatch');
  }
  console.log('✓ Found Year 2026 with correct join code VENTURE26');

  // 2b. Test Required Targets Settings & Updates
  console.log('2b. Testing Required Targets Goal setting and update...');
  await updateYearSettings(2026, { requiredTargets: 10 });
  const updatedYear2026 = await getYearByNumber(2026);
  if (!updatedYear2026 || updatedYear2026.requiredTargets !== 10) {
    throw new Error('Failed to update requiredTargets on year 2026');
  }
  console.log(`✓ Updated Year 2026 requiredTargets goal to ${updatedYear2026.requiredTargets}`);

  // 2c. Test Creating a Year Session with requiredTargets
  console.log('2c. Testing creation of year session with requiredTargets...');
  const testYearNum = 2099;
  const existingTestYear = await getYearByNumber(testYearNum);
  if (!existingTestYear) {
    const createdYear = await createYearSession({
      year: testYearNum,
      title: 'DragonCon 2099 Scavenger Hunt',
      joinCode: 'VENTURE99',
      requiredTargets: 15,
    });
    if (createdYear.requiredTargets !== 15) throw new Error('Failed to create year with requiredTargets');
    console.log(`✓ Created session for ${testYearNum} with target goal: ${createdYear.requiredTargets}`);
  }

  // 3. Test Targets & Seed Data
  console.log('3. Testing Target Checklist queries...');
  const initialTargets = await getTargetsForYear(2026);
  if (initialTargets.length === 0) throw new Error('No seeded targets found for 2026');
  console.log(`✓ Retrieved ${initialTargets.length} initial targets for DragonCon 2026.`);

  // 4. Test Single Target Creation
  console.log('4. Testing single target creation...');
  const customTarget = await createTarget({
    yearNumber: 2026,
    name: 'Henchman 24 Ghost',
    categoryTag: 'Henchmen',
    description: "I don't think this is a good idea, 21.",
  });
  if (!customTarget.id) throw new Error('Target creation failed');
  console.log(`✓ Created single target: "${customTarget.name}" (${customTarget.id})`);

  // 5. Test Bulk Import
  console.log('5. Testing bulk import...');
  const bulkData = [
    { name: 'Dr. Jonas Venture Jr. in mechanical suit', categoryTag: 'Team Venture', description: "My father's dream was a world of super-science!" },
    { name: 'Colonel Gentleman with cane', categoryTag: 'Original Team Venture' },
    { name: 'Underbheit in metallic jaw', categoryTag: 'Guild of Calamitous Intent' },
  ];
  const importResult = await bulkImportTargets(2026, bulkData);
  if (importResult.count !== 3) throw new Error('Bulk import count mismatch');
  console.log(`✓ Successfully bulk imported ${importResult.count} cosplayer targets.`);

  // 6. Test Photo Submission & Status transition
  console.log('6. Testing Sighting submission & status update...');
  const subResult = await createSubmissionAction({
    targetId: customTarget.id,
    yearNumber: 2026,
    imageUrl: 'https://placehold.co/800x600/png?text=Henchman24Ghost',
    photographerName: 'Hank',
    caption: 'Spotted at the Marriott atrium!',
  });
  if (!subResult.id) throw new Error('Submission creation failed');

  let updatedTargets = await getTargetsForYear(2026);
  let updatedCustomTarget = updatedTargets.find((t) => t.id === customTarget.id);
  if (!updatedCustomTarget || updatedCustomTarget.status !== 'FOUND' || updatedCustomTarget.submissions.length !== 1) {
    throw new Error('Target status did not update to FOUND or submission missing');
  }
  console.log(`✓ Submission logged. Target status updated to FOUND with photographer credit: ${updatedCustomTarget.submissions[0].photographerName}`);

  // 6a. Verify Single Photo Constraint (reject duplicate submission)
  console.log('6a. Testing rejection of duplicate photo submission for already found target...');
  let duplicateRejected = false;
  try {
    await createSubmissionAction({
      targetId: customTarget.id,
      yearNumber: 2026,
      imageUrl: 'https://placehold.co/800x600/png?text=DuplicatePhoto',
      photographerName: 'Dean',
    });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message.includes('already has a sighting photo')) {
      duplicateRejected = true;
    }
  }
  if (!duplicateRejected) {
    throw new Error('Duplicate submission was not rejected for already found target');
  }
  console.log('✓ Successfully rejected duplicate photo submission for target.');

  // 6b. Test Photo Submission Deletion
  console.log('6b. Testing Sighting submission deletion & reset to NEEDED...');
  await deleteSubmissionAction(subResult.id, customTarget.id, 2026);
  updatedTargets = await getTargetsForYear(2026);
  updatedCustomTarget = updatedTargets.find((t) => t.id === customTarget.id);
  if (!updatedCustomTarget || updatedCustomTarget.status !== 'NEEDED' || updatedCustomTarget.submissions.length !== 0) {
    throw new Error('Target status did not reset to NEEDED after submission deletion');
  }
  console.log('✓ Submission deleted successfully. Target status reset to NEEDED.');

  // 7. Test Rank Milestone calculations and Overdrive
  console.log('7. Testing Rank Milestone & Overdrive calculation...');
  const m0 = getRankMilestone(0);
  const m50 = getRankMilestone(50);
  const m100 = getRankMilestone(100);
  const m120 = getRankMilestone(120);
  if (m0.title !== 'Level 1 Henchman') throw new Error('0% milestone incorrect');
  if (m50.title !== 'OSI Special Agent') throw new Error('50% milestone incorrect');
  if (m100.title !== 'Guild Sovereign') throw new Error('100% milestone incorrect');
  if (m120.title !== 'Super-Science Overdrive') throw new Error('120% overdrive milestone incorrect');
  console.log(`✓ Milestone calculations validated (0%: "${m0.title}", 50%: "${m50.title}", 100%: "${m100.title}", 120%: "${m120.title}")`);

  // 8. Clean up created test target
  console.log('8. Cleaning up test target...');
  await deleteTarget(customTarget.id, 2026);
  console.log('✓ Test target cleaned up.');

  // 9. Test Master Admin Clearance PIN validation
  console.log('9. Testing Master Admin Clearance PIN validation...');
  if (!validateAdminPin('VENTURE')) throw new Error('Default admin PIN VENTURE failed to validate');
  if (!validateAdminPin('venture')) throw new Error('Case-insensitive admin PIN failed to validate');
  if (validateAdminPin('INVALID_PIN')) throw new Error('Invalid admin PIN unexpectedly passed');
  if (validateAdminPin('')) throw new Error('Empty admin PIN unexpectedly passed');
  console.log('✓ Master Admin Clearance PIN validation succeeded.');

  console.log('\n========================================');
  console.log('ALL VERIFICATION TESTS PASSED SUCCESSFULLY!');
  console.log('========================================\n');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
