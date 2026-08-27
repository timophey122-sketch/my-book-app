import { writeFile } from 'node:fs/promises';

const languages = [
  ['ru','Русский'],['en','English'],['es','Español'],['zh','中文'],['hi','हिन्दी'],['ar','العربية'],['pt','Português'],['bn','বাংলা'],['fr','Français'],['de','Deutsch'],
  ['ja','日本語'],['ko','한국어'],['tr','Türkçe'],['it','Italiano'],['pl','Polski'],['uk','Українська'],['nl','Nederlands'],['id','Bahasa Indonesia'],['vi','Tiếng Việt'],['th','ไทย'],
  ['fa','فارسی'],['ur','اردو'],['ms','Bahasa Melayu'],['fil','Filipino'],['ro','Română'],['cs','Čeština'],['el','Ελληνικά'],['sv','Svenska'],['hu','Magyar'],['he','עברית'],
  ['da','Dansk'],['fi','Suomi'],['no','Norsk'],['sk','Slovenčina'],['bg','Български'],['sr','Српски'],['hr','Hrvatski'],['lt','Lietuvių'],['lv','Latviešu'],['et','Eesti'],
  ['sl','Slovenščina'],['ca','Català'],['sw','Kiswahili'],['ta','தமிழ்'],['te','తెలుగు'],['mr','मराठी'],['gu','ગુજરાતી'],['kn','ಕನ್ನಡ'],['ml','മലയാളം'],['ne','नेपाली'],
];

const base = {
  family:'Family reading', intro:'A parent creates a family and receives a family code. A child registers with that code and their name.',
  parentLogin:'Parent sign in', parentRegister:'Parent registration', childLogin:'Child sign in', childRegister:'Child registration',
  email:'Email', password:'Password', confirm:'Confirm password', childName:'Child name', code:'Family code', login:'Sign in', register:'Register', back:'Back',
  library:'Library', calendar:'Calendar', achievements:'Achievements', settings:'Settings', newBook:'+ New book', noBooks:'No books yet',
  noBooksText:'Add the first book and track progress by day.', title:'Title', author:'Author', total:'Total pages', daily:'Daily goal', save:'Save', cancel:'Cancel',
  readToday:'How many pages did you read today?', future:'Future days are locked', quiz:'Take quiz', bookRead:'Book completed', edit:'Edit book',
  theme:'Theme', light:'Light', dark:'Dark', language:'Interface language', notifications:'Notifications', review:'Leave a review', logout:'Sign out',
  rewards:'Rewards', events:'Child activity', parentHome:'Family', devPassword:'Developer password', wrongCode:'Wrong password',
  fill:'Fill in all fields', mismatch:'Passwords do not match', authError:'Unable to sign in', loading:'Loading…', progress:'Progress', days:'days',
  books:'books', pages:'pages', level:'Level', streak:'Reading streak', completed:'Completed books',
  rewardHint:'Create rewards here for the child to choose.', addReward:'+ New reward', noEvents:'No new activity yet', familyCode:'Your family code',
  copyHint:'Give this code to the child for registration.', account:'Account', deleteBook:'Delete book?', delete:'Delete', quizTitle:'Quiz',
  quizText:'The book quiz will contain questions about the plot and characters.', quizReady:'The quiz is being prepared.', goal:'goal',
  firstBook:'First book', readingWeek:'Reading week', bookExplorer:'Book explorer', thousandPages:'One thousand pages',
  reminderInfo:'Five reminders per day. They stop after you record reading for today.', rewardExample:'For example: a family trip to the cinema',
  switchToChild:'Switch to child account', switchToParent:'Switch to parent account', developerChild:'Developer', developerFamily:'Developer family',
  childLinked:'Linked child', error:'Error', emailUsed:'This email is already registered.', badCredentials:'Incorrect email or password.',
  weakPassword:'The password must contain at least 6 characters.', noNetwork:'No connection to the server. Check your internet connection.',
  permissionDenied:'The server denied this operation.', unknownError:'Unknown error.', parentMissing:'Parent profile not found.', familyMissing:'No family with this code was found.',
  childExists:'A child with this name is already registered. Use sign in.', childMissing:'Child account not found. Register first.',
  takeQuiz:'Take quiz', quizCreating:'The test is being created', pleaseWait:'Please wait. The AI is checking the book and preparing questions.',
  quizChecking:'Checking your answers…', quizGenerationFailed:'The test could not be created.', quizNeedsAuthor:'Add the book author before creating a test.',
  question:'Question', of:'of', timeLeft:'Time left', nextQuestion:'Next question', finishQuiz:'Finish test', hint:'Hint',
  quizPassed:'Test passed!', quizFailed:'Test not passed', quizScore:'Result', retryQuiz:'Return to the book and try again',
  rewardShowcase:'Reward showcase', chooseReward:'Choose this reward', rewardChosen:'Reward selected', noRewardsAvailable:'There are no available rewards yet.',
  backToBook:'Back to the book', testResults:'Test results', noTestResults:'No tests have been completed yet.', passed:'Passed', failed:'Not passed',
  timerExpired:'Time is up. Unanswered questions were counted as incorrect.', quizUnavailable:'Test unavailable', quizIntegrityError:'The test has an incorrect format.', answerRequired:'Choose an answer.',
  children:'Children', chooseChild:'Choose a child', chooseBook:'Choose a book', childBooks:"Child's books", backToChildren:'Back to children', backToBooks:'Back to books',
  viewProgress:'View progress', parentReadOnly:'View only: a parent cannot change progress.', fiveRewards:'Enter exactly 5 rewards for this book', saveFiveRewards:'Save 5 rewards',
  rewardsReady:'Five rewards are ready', selectChildAndBook:'Choose a child and a book first', quizInterrupted:'Test reset',
  quizInterruptedText:'The app was minimized or another window was opened. Start again — the questions will be new.', startNewQuiz:'Start a new test',
  secondsPerQuestion:'Each question has 20 seconds', testAlreadyPassed:'Test already passed', rewardNotificationTitle:'Reward selected',
  rewardNotificationBody:'The child passed the test and selected a reward', questionTimedOut:'Time for this question is over.',
  tests:'Tests', testReady:'Test ready', testNotCreated:'Test not created', createTest:'Create test', editTest:'Edit test', noBooksForTests:'The child has no books yet.',
  testBuilderHint:'Create exactly 5 questions. Each question must have 5 different answers. Mark one correct answer.', questionText:'Question text', answer:'Answer', correctAnswer:'Correct answer',
  fillAllTestFields:'Fill in all 5 questions and all answer choices.', saveTest:'Save test', testNotReady:'The test is not ready yet', askParentCreateTest:'Ask a parent to create a test for this book.',
  readEvent:'pages read', today:'today', sun:'SUN', mon:'MON', tue:'TUE', wed:'WED', thu:'THU', fri:'FRI', sat:'SAT',
  reminder1:'Time to open your book and continue the adventure!', reminder2:'Even a few pages bring you closer to your goal.',
  reminder3:'Your book is waiting for the next chapter.', reminder4:'Keep your reading streak alive today.', reminder5:'Last reminder: record the pages you read.'
};

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
async function translateOne(target, value, attempt=0) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(value)}`;
  const response = await fetch(url);
  if (!response.ok) {
    if (attempt < 4) { await wait(500 * (attempt + 1)); return translateOne(target, value, attempt + 1); }
    throw new Error(`${target}: HTTP ${response.status}`);
  }
  const json = await response.json();
  return json[0].map(part => part[0]).join('').trim();
}
async function translateAll(target) {
  if (target === 'en') return base;
  const entries = Object.entries(base);
  const out = {};
  for (let start=0; start<entries.length; start+=12) {
    const batch = entries.slice(start,start+12);
    const values = await Promise.all(batch.map(([,value]) => translateOne(target,value)));
    batch.forEach(([key],i) => out[key]=values[i]);
    await wait(80);
  }
  return out;
}

const text = {};
for (const [code] of languages) {
  process.stdout.write(`${code} `);
  text[code] = await translateAll(code);
  await wait(120);
}
const source = `export const LANGUAGES = ${JSON.stringify(languages,null,2)} as const;\n\nexport const TEXT: Record<string, Record<string,string>> = ${JSON.stringify(text,null,2)};\n`;
await writeFile(new URL('../src/i18n.ts', import.meta.url), source, 'utf8');
console.log(`\nWrote ${languages.length} languages × ${Object.keys(base).length} strings.`);
