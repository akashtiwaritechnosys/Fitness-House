
    // NAV SCROLL EFFECT
    window.addEventListener('scroll', () => {
      const nav = document.getElementById('navbar');
      const btt = document.getElementById('backToTop');
      if (window.scrollY > 100) {
        nav.classList.add('scrolled');
        btt.style.display = 'flex';
      } else {
        nav.classList.remove('scrolled');
        btt.style.display = 'none';
      }
    });

    document.getElementById('backToTop').addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // HAMBURGER
    function toggleMenu() { const m = document.getElementById('mobileMenu'); m.classList.toggle('open'); }

    // COUNTER ANIMATION
    function animateCounters() {
      document.querySelectorAll('[data-count]').forEach(el => {
        const target = +el.dataset.count;
        let current = 0;
        const duration = 2000;
        const stepTime = 16;
        const steps = duration / stepTime;
        const increment = target / steps;

        const timer = setInterval(() => {
          current += increment;
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          el.textContent = Math.floor(current).toLocaleString() + (target > 100 ? '+' : '');
        }, stepTime);
      });
    }

    // BILLING TOGGLE
    const prices = {
      monthly: ['₹1,499', '₹2,999', '₹5,499'],
      annual: ['₹1,124', '₹2,249', '₹4,124']
    };
    let isAnnual = false;
    function toggleBilling() {
      isAnnual = !isAnnual;
      document.getElementById('billingToggle').classList.toggle('active');
      ['p1', 'p2', 'p3'].forEach((id, i) => {
        document.getElementById(id).textContent = isAnnual ? prices.annual[i] : prices.monthly[i];
      });
    }

    // CALC TABS
    function showCalc(id, btn) {
      document.querySelectorAll('.calc-panel').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.calc-tab').forEach(t => t.classList.remove('active'));
      document.getElementById('calc-' + id).classList.add('active');
      btn.classList.add('active');
    }

    // SHOW RESULT
    function showResult(resBoxId, placeholderId) {
      const placeholder = document.querySelector('#' + placeholderId + ' .result-placeholder');
      if (placeholder) placeholder.style.display = 'none';
      const rb = document.getElementById(resBoxId);
      rb.classList.add('show');
    }

    // REVEAL ANIMATION
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          if (e.target.classList.contains('hero-stats')) animateCounters();
        }
      });
    }, { threshold: .15 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // CALCULATIONS
    function calcBMI() {
      const h = +document.getElementById('bmi_height').value;
      const w = +document.getElementById('bmi_weight').value;
      if (!h || !w) return alert('Please fill all fields.');
      const bmi = +(w / ((h / 100) ** 2)).toFixed(1);
      let cat, color, tips;
      if (bmi < 18.5) { cat = 'Underweight'; color = '#5bc8fa'; tips = ['Increase caloric intake', 'Focus on nutrient-dense foods', 'Incorporate strength training', 'Consult a dietitian']; }
      else if (bmi < 25) { cat = 'Normal Weight'; color = '#4caf50'; tips = ['Maintain your current lifestyle', 'Stay active with regular exercise', 'Eat a balanced diet', 'Monitor weight periodically']; }
      else if (bmi < 30) { cat = 'Overweight'; color = '#f5c400'; tips = ['Aim for 300–500 calorie deficit daily', 'Add cardio 3–5 times per week', 'Reduce refined sugar and processed food', 'Stay hydrated']; }
      else { cat = 'Obese'; color = '#e63a2e'; tips = ['Consult a healthcare professional', 'Start with low-impact exercise', 'Track your food intake daily', 'Set small, achievable goals']; }
      document.getElementById('bmi-val').textContent = bmi;
      const catEl = document.getElementById('bmi-cat'); catEl.textContent = cat; catEl.style.background = color; catEl.style.color = bmi < 25 && bmi >= 18.5 ? '#000' : '#fff';
      document.getElementById('bmi-hw').textContent = h + 'cm / ' + w + 'kg';
      document.getElementById('bmi-range').textContent = '18.5 – 24.9';
      const tipsEl = document.getElementById('bmi-tips'); if (tipsEl) tipsEl.innerHTML = tips.map(t => `<li>${t}</li>`).join('');
      showResult('bmi-result', 'res-bmi');
    }

    function calcCalorie() {
      const age = +document.getElementById('cal_age').value;
      const h = +document.getElementById('cal_height').value;
      const w = +document.getElementById('cal_weight').value;
      const act = +document.getElementById('cal_activity').value;
      const goal = document.getElementById('cal_goal').value;
      const gender = document.querySelector('input[name="cal_gender"]:checked').value;
      if (!age || !h || !w) return alert('Please fill all fields.');
      let bmr = gender === 'male' ? 10 * w + 6.25 * h - 5 * age + 5 : 10 * w + 6.25 * h - 5 * age - 161;
      const tdee = Math.round(bmr * act);
      bmr = Math.round(bmr);
      let target = tdee, goalLabel = 'Maintain Weight';
      if (goal === 'lose') { target = tdee - 500; goalLabel = 'Weight Loss (-500 kcal)'; }
      else if (goal === 'gain') { target = tdee + 300; goalLabel = 'Muscle Gain (+300 kcal)'; }
      const protein = Math.round(w * 2); const fat = Math.round(target * 0.25 / 9); const carbs = Math.round((target - protein * 4 - fat * 9) / 4);
      document.getElementById('cal-val').textContent = target;
      document.getElementById('cal-goal-label').textContent = goalLabel;
      document.getElementById('cal-bmr').textContent = bmr + ' kcal';
      document.getElementById('cal-tdee').textContent = tdee + ' kcal';
      document.getElementById('cal-macros').innerHTML = `<li>Protein: ${protein}g (${Math.round(protein * 4 / target * 100)}%)</li><li>Carbs: ${carbs}g (${Math.round(carbs * 4 / target * 100)}%)</li><li>Fats: ${fat}g (${Math.round(fat * 9 / target * 100)}%)</li>`;
      showResult('calorie-result', 'res-calorie');
    }

    function toggleHip(show) { const g = document.getElementById('hip_group'); if (g) g.style.display = show ? 'block' : 'none'; }
    function calcBodyFat() {
      const gender = document.querySelector('input[name="bf_gender"]:checked').value;
      const h = +document.getElementById('bf_height').value;
      const neck = +document.getElementById('bf_neck').value;
      const waist = +document.getElementById('bf_waist').value;
      const hip = +document.getElementById('bf_hip').value || 0;
      if (!h || !neck || !waist) return alert('Please fill all fields.');
      let bf;
      if (gender === 'male') { bf = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(h)) - 450; }
      else { bf = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(h)) - 450; }
      bf = +bf.toFixed(1);
      const w = 70; // Default weight for mass calculation if not available
      const fatMass = +(w * bf / 100).toFixed(1);
      const leanMass = +(w - fatMass).toFixed(1);
      let cat, color;
      if (gender === 'male') { if (bf < 6) cat = 'Essential Fat'; else if (bf < 14) cat = 'Athletic'; else if (bf < 18) cat = 'Fitness'; else if (bf < 25) cat = 'Average'; else cat = 'Obese'; }
      else { if (bf < 14) cat = 'Essential Fat'; else if (bf < 21) cat = 'Athletic'; else if (bf < 25) cat = 'Fitness'; else if (bf < 32) cat = 'Average'; else cat = 'Obese'; }
      color = cat === 'Athletic' || cat === 'Fitness' ? '#4caf50' : cat === 'Average' ? '#f5c400' : '#e63a2e';
      document.getElementById('bf-val').textContent = bf;
      const catEl = document.getElementById('bf-cat'); catEl.textContent = cat; catEl.style.background = color; catEl.style.color = '#fff';
      document.getElementById('bf-lean').textContent = leanMass + ' kg';
      document.getElementById('bf-fat').textContent = fatMass + ' kg';
      showResult('bodyfat-result', 'res-bodyfat');
    }

    function calcProtein() {
      const w = +document.getElementById('prot_weight').value;
      const goal = document.getElementById('prot_goal').value;
      if (!w) return alert('Please enter your weight.');
      const multipliers = { lose: 2.2, maintain: 1.6, gain: 2.0, max: 2.5 };
      const gkg = multipliers[goal];
      const total = Math.round(w * gkg);
      document.getElementById('prot-val').textContent = total;
      document.getElementById('prot-gkg').textContent = gkg + ' g/kg';
      document.getElementById('prot-meals').textContent = Math.round(total / 4) + ' g';
      showResult('protein-result', 'res-protein');
    }

    function calcORM() {
      const w = +document.getElementById('orm_weight').value;
      const r = +document.getElementById('orm_reps').value;
      const formula = document.getElementById('orm_formula').value;
      if (!w || !r) return alert('Please fill all fields.');
      let orm;
      if (formula === 'epley') orm = r === 1 ? w : w * (1 + r / 30);
      else if (formula === 'brzycki') orm = w * (36 / (37 - r));
      else if (formula === 'lander') orm = 100 * w / (101.3 - 2.67123 * r);
      else orm = w * Math.pow(r, 0.1);
      orm = Math.round(orm);
      document.getElementById('orm-val').textContent = orm;
      document.getElementById('orm-90').textContent = Math.round(orm * 0.9) + ' kg';
      document.getElementById('orm-80').textContent = Math.round(orm * 0.8) + ' kg';
      document.getElementById('orm-70').textContent = Math.round(orm * 0.7) + ' kg';
      document.getElementById('orm-60').textContent = Math.round(orm * 0.6) + ' kg';
      showResult('onerepmax-result', 'res-onerepmax');
    }

    function calcIdealWeight() {
      const h = +document.getElementById('iw_height').value;
      const gender = document.querySelector('input[name="iw_gender"]:checked').value;
      const frame = document.getElementById('iw_frame').value;
      if (!h) return alert('Please enter your height.');
      const hi = (h - 152.4) / 2.54;
      let hamwi, devine, robinson, miller;
      if (gender === 'male') { hamwi = 48 + 2.7 * hi; devine = 50 + 2.3 * hi; robinson = 52 + 1.9 * hi; miller = 56.2 + 1.41 * hi; }
      else { hamwi = 45.4 + 2.3 * hi; devine = 45.5 + 2.3 * hi; robinson = 49 + 1.7 * hi; miller = 53.1 + 1.36 * hi; }
      const frameAdj = frame === 'small' ? -0.1 : frame === 'large' ? 0.1 : 0;
      hamwi = +(hamwi * (1 + frameAdj)).toFixed(1); devine = +(devine * (1 + frameAdj)).toFixed(1); robinson = +(robinson * (1 + frameAdj)).toFixed(1); miller = +(miller * (1 + frameAdj)).toFixed(1);
      const low = Math.min(hamwi, devine, robinson, miller).toFixed(1);
      const high = Math.max(hamwi, devine, robinson, miller).toFixed(1);
      document.getElementById('iw-val').textContent = low + ' – ' + high;
      document.getElementById('iw-hamwi').textContent = hamwi + ' kg';
      document.getElementById('iw-devine').textContent = devine + ' kg';
      document.getElementById('iw-robinson').textContent = robinson + ' kg';
      document.getElementById('iw-miller').textContent = miller + ' kg';
      showResult('idealweight-result', 'res-idealweight');
    }

    function calcWater() {
      const w = +document.getElementById('water_weight').value;
      const act = +document.getElementById('water_activity').value;
      const climate = +document.getElementById('water_climate').value;
      if (!w) return alert('Please enter your weight.');
      const base = w * 0.033;
      const total = +(base * act * climate).toFixed(2);
      const ml = Math.round(total * 1000);
      const glasses = Math.round(ml / 250);
      document.getElementById('water-val').textContent = total;
      document.getElementById('water-ml').textContent = ml + ' ml';
      document.getElementById('water-glasses').textContent = glasses;
      showResult('water-result', 'res-water');
    }

    function calcBurned() {
      const w = +document.getElementById('burn_weight').value;
      const met = +document.getElementById('burn_exercise').value;
      const t = +document.getElementById('burn_time').value;
      if (!w || !t) return alert('Please fill all fields.');
      const cal = Math.round(met * w * t / 60);
      const perMin = +(cal / t).toFixed(1);
      const perHour = Math.round(perMin * 60);
      document.getElementById('burn-val').textContent = cal;
      document.getElementById('burn-permin').textContent = perMin;
      document.getElementById('burn-perhour').textContent = perHour;
      showResult('burned-result', 'res-burned');
    }
    
    // TRACKER LOGIC
    let trkData = JSON.parse(localStorage.getItem('FitnessHouse_tracker')) || {
      workouts: [],
      nutrition: [],
      water: 0,
      steps: 0,
      weight: 0,
      notes: ''
    };

    function saveTrackerData() {
      localStorage.setItem('FitnessHouse_tracker', JSON.stringify(trkData));
      updateDashboard();
    }

    function updateDashboard() {
      // Goals
      const goalCal = 2500, goalBurn = 500, goalProt = 150, goalWater = 3000, goalSteps = 10000;
      
      // Calculate Totals
      const totCal = trkData.nutrition.reduce((sum, item) => sum + (+item.cal), 0);
      const totProt = trkData.nutrition.reduce((sum, item) => sum + (+item.prot), 0);
      const totBurn = (trkData.workouts.length * 120) + Math.floor(trkData.steps * 0.04);
      
      // Update UI Vals
      document.getElementById('trk-cal-in').textContent = totCal;
      document.getElementById('trk-cal-out').textContent = totBurn;
      document.getElementById('trk-protein').textContent = totProt;
      document.getElementById('trk-water').textContent = trkData.water;
      document.getElementById('trk-steps').textContent = trkData.steps;

      // Update Bars
      document.getElementById('bar-cal-in').style.width = Math.min((totCal/goalCal)*100, 100) + '%';
      document.getElementById('bar-cal-out').style.width = Math.min((totBurn/goalBurn)*100, 100) + '%';
      document.getElementById('bar-protein').style.width = Math.min((totProt/goalProt)*100, 100) + '%';
      document.getElementById('bar-water').style.width = Math.min((trkData.water/goalWater)*100, 100) + '%';
      document.getElementById('bar-steps').style.width = Math.min((trkData.steps/goalSteps)*100, 100) + '%';
      
      document.getElementById('current-weight-display').textContent = 'Current Weight: ' + (trkData.weight ? trkData.weight + ' kg' : '-- kg');
      
      renderWorkoutList();
      renderNutritionList();
      
      if (document.getElementById('journal_notes').value === '') {
        document.getElementById('journal_notes').value = trkData.notes;
      }
    }

    function addWorkout(e) {
      e.preventDefault();
      const name = document.getElementById('wo_name').value;
      const sets = document.getElementById('wo_sets').value;
      const reps = document.getElementById('wo_reps').value;
      const weight = document.getElementById('wo_weight').value || 0;
      trkData.workouts.push({ name, sets, reps, weight });
      saveTrackerData();
      e.target.reset();
    }

    function renderWorkoutList() {
      const ul = document.getElementById('workout-list');
      ul.innerHTML = trkData.workouts.map(w => 
        `<li class="tracker-item">
          <div class="tracker-item-main">${w.name}</div>
          <div class="tracker-item-sub">${w.sets} sets x ${w.reps} reps @ ${w.weight}kg</div>
        </li>`
      ).join('');
    }

    function clearWorkouts() {
      trkData.workouts = [];
      saveTrackerData();
    }

    function addNutrition(e) {
      e.preventDefault();
      const name = document.getElementById('nu_name').value;
      const cal = document.getElementById('nu_cal').value;
      const prot = document.getElementById('nu_prot').value || 0;
      const carb = document.getElementById('nu_carb').value || 0;
      trkData.nutrition.push({ name, cal, prot, carb });
      saveTrackerData();
      e.target.reset();
    }

    function renderNutritionList() {
      const ul = document.getElementById('nutrition-list');
      ul.innerHTML = trkData.nutrition.map(n => 
        `<li class="tracker-item">
          <div class="tracker-item-main">${n.name}</div>
          <div class="tracker-item-sub">${n.cal} kcal | ${n.prot}g P</div>
        </li>`
      ).join('');
    }

    function clearNutrition() {
      trkData.nutrition = [];
      saveTrackerData();
    }

    function addWater(amount) {
      trkData.water += amount;
      saveTrackerData();
    }

    function addSteps(e) {
      e.preventDefault();
      const st = +document.getElementById('st_count').value;
      trkData.steps += st;
      saveTrackerData();
      e.target.reset();
    }

    function addWeight(e) {
      e.preventDefault();
      const wt = +document.getElementById('wt_val').value;
      trkData.weight = wt;
      saveTrackerData();
      e.target.reset();
    }

    function saveNotes() {
      trkData.notes = document.getElementById('journal_notes').value;
      saveTrackerData();
      alert('Journal saved!');
    }

    function clearDaily() {
      if(confirm('Are you sure you want to reset your daily water and steps?')) {
        trkData.water = 0;
        trkData.steps = 0;
        saveTrackerData();
      }
    }

    document.addEventListener('DOMContentLoaded', () => {
      updateDashboard();
    });
    
    // SCROLL SPY FOR NAVBAR
    const sections = document.querySelectorAll('section');
    const navLi = document.querySelectorAll('.nav-links a, .mobile-menu a');

    window.addEventListener('scroll', () => {
      let current = '';
      const scrollY = window.pageYOffset;
      
      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        // Adjust the offset to trigger slightly before the section hits the top
        if (scrollY >= (sectionTop - 200)) {
          current = section.getAttribute('id');
        }
      });

      navLi.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
          link.classList.add('active');
        }
      });
    });


   // ========== FOOD & NUTRITION SECTION ==========
let currentFoodTab = 'veg';
let currentGoalFilter = 'all';

function switchFoodTab(tab) {
  currentFoodTab = tab;

  // Show correct carousel
  document.getElementById('food-veg').style.display =
    tab === 'veg' ? 'block' : 'none';

  document.getElementById('food-nonveg').style.display =
    tab === 'nonveg' ? 'block' : 'none';

  // Active tab
  document.getElementById('tab-veg').classList.toggle('active', tab === 'veg');
  document.getElementById('tab-nonveg').classList.toggle('active', tab === 'nonveg');

  // Reset filters
  document.getElementById('food-search').value = '';
  currentGoalFilter = 'all';

  document.querySelectorAll('.food-filter').forEach(btn => {
    btn.classList.remove('active');
  });

  document.querySelector('.food-filter').classList.add('active');

  applyFoodFilters();
}

function filterByGoal(goal, btn) {
  currentGoalFilter = goal;

  document.querySelectorAll('.food-filter').forEach(btn => {
    btn.classList.remove('active');
  });

  btn.classList.add('active');

  applyFoodFilters();
}

function filterFoods() {
  applyFoodFilters();
}

function applyFoodFilters() {
  const query = document.getElementById('food-search').value.toLowerCase().trim();

  const carousel = currentFoodTab === 'veg'
    ? document.getElementById('food-veg')
    : document.getElementById('food-nonveg');

  const items = carousel.querySelectorAll('.owl-item');
  let visibleCount = 0;

  items.forEach(item => {
    const card = item.querySelector('.food-card');
    if (!card) return;

    const name = card.querySelector('.food-name').textContent.toLowerCase();
    const desc = card.querySelector('.food-desc').textContent.toLowerCase();
    const goals = card.dataset.goal || '';

    const matchesSearch =
      !query || name.includes(query) || desc.includes(query);

    const matchesGoal =
      currentGoalFilter === 'all' || goals.includes(currentGoalFilter);

    if (matchesSearch && matchesGoal) {
      item.style.display = 'block';
      visibleCount++;
    } else {
      item.style.display = 'none';
    }
  });

  // Refresh Owl Carousel
  $(carousel).trigger('refresh.owl.carousel');

  // No results message
  document.getElementById('food-no-results').style.display =
    visibleCount === 0 ? 'block' : 'none';
}