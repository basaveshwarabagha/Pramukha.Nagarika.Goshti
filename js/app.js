/* ============================================================
   RSS Portal – Pramukha Nagarika Goshti – App Logic
   ============================================================ */

'use strict';

// ============================================================
// ADMIN CREDENTIALS  (change these as needed)
// ============================================================
const ADMIN_USER = 'admin';
const ADMIN_PASS = '123456';

// ---- State ----
let members = JSON.parse(localStorage.getItem('png_members') || '[]');
let deleteTargetId = null;
let isAdminLoggedIn = sessionStorage.getItem('rss_admin') === 'true';

// ---- Helpers ----
const $ = id => document.getElementById(id);

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function saveToStorage() {
  localStorage.setItem('png_members', JSON.stringify(members));
}

// ============================================================
// NAVIGATION
// ============================================================
function showSection(id) {
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));
  const section = $(id);
  if (section) section.classList.add('active');
  document.querySelectorAll('.nav-link').forEach(a => {
    if (a.getAttribute('href') === '#' + id) a.classList.add('active');
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// RENDER TABLE
// ============================================================
function renderTable(list) {
  const thead = $('tableHead');
  const tbody = $('tableBody');

  // Build header based on admin status
  if (isAdminLoggedIn) {
    thead.innerHTML = `<tr>
      <th>#</th><th>Full Name</th><th>Age</th><th>Mobile</th>
      <th>Nagara</th><th>Occupation</th>
      <th>Samparka Gatanayak</th><th>Samparka Refrence</th>
      <th>Status of Samparka</th><th>Actions</th>
    </tr>`;
  } else {
    thead.innerHTML = `<tr>
      <th>#</th><th>Full Name</th><th>Status of Samparka</th><th>Actions</th>
    </tr>`;
  }

  const colSpan = isAdminLoggedIn ? 10 : 4;

  tbody.innerHTML = '';

  if (!list || list.length === 0) {
    tbody.innerHTML = `<tr id="emptyRow"><td colspan="${colSpan}" class="empty-msg">No members found.</td></tr>`;
    updateStats(members);
    return;
  }

  list.forEach((m, idx) => {
    const selected = m.samparkaStatus || '';
    const statusHtml = `
      <select class="inline-status" onchange="updateStatus('${m.id}', this.value)" style="padding:4px 6px;border-radius:6px;border:1px solid #ccc;font-size:0.8rem;cursor:pointer;">
        <option value="">—</option>
        <option value="Samparka not done" ${selected === 'Samparka not done' ? 'selected' : ''}>Samparka not done</option>
        <option value="Samparka done" ${selected === 'Samparka done' ? 'selected' : ''}>Samparka done</option>
        <option value="Invitation given" ${selected === 'Invitation given' ? 'selected' : ''}>Invitation given</option>
        <option value="Follow up done" ${selected === 'Follow up done' ? 'selected' : ''}>Follow up done</option>
        <option value="Confirmed" ${selected === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
        <option value="Not coming" ${selected === 'Not coming' ? 'selected' : ''}>Not coming</option>
      </select>`;

    const tr = document.createElement('tr');
    tr.dataset.id = m.id;

    if (isAdminLoggedIn) {
      tr.innerHTML = `
        <td class="sr-cell">${idx + 1}</td>
        <td><strong>${esc(m.fullName)}</strong></td>
        <td>${esc(m.age)}</td>
        <td>${esc(m.mobile)}</td>
        <td>${m.area  ? esc(m.area)  : '<span style="color:#aaa">—</span>'}</td>
        <td>${m.occupation ? esc(m.occupation) : '<span style="color:#aaa">—</span>'}</td>
        <td>${m.samparkaGatanayak ? esc(m.samparkaGatanayak) : '<span style="color:#aaa">—</span>'}</td>
        <td>${m.samparkaRefrence ? esc(m.samparkaRefrence) : '<span style="color:#aaa">—</span>'}</td>
        <td>${statusHtml}</td>
        <td>
          <button class="tbl-btn tbl-edit" onclick="openModal('edit','${m.id}')">✏️ Edit</button>
          <button class="tbl-btn tbl-del"  onclick="openDeleteDialog('${m.id}')">🗑️ Delete</button>
        </td>`;
    } else {
      tr.innerHTML = `
        <td class="sr-cell">${idx + 1}</td>
        <td><strong>${esc(m.fullName)}</strong></td>
        <td>${statusHtml}</td>
        <td>
          <button class="tbl-btn tbl-edit" onclick="openModal('edit','${m.id}')">🔄 Update</button>
        </td>`;
    }

    tbody.appendChild(tr);
  });

  updateStats(members);
}

function esc(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"');
}

// ============================================================
// STATS
// ============================================================
function updateStats(list) {
  $('totalCount').textContent = list.length;

  // Per-nagara counts
  const nagaras = ['Kamala Nagara', 'Basaveshwara Nagara', 'Mahalakshmi Nagara', 'Nagpura Nagara', 'Rajajinagara'];
  const statsBar = $('statsBar');

  // Remove any existing per-nagara items
  statsBar.querySelectorAll('.stat-item-nagara').forEach(el => el.remove());

  for (const nagara of nagaras) {
    const count = list.filter(m => m.area === nagara).length;
    const item = document.createElement('div');
    item.className = 'stat-item stat-item-nagara';
    item.innerHTML = `<span class="stat-num">${count}</span><span class="stat-label">${esc(nagara)}</span>`;
    statsBar.appendChild(item);
  }
}

// ============================================================
// SEARCH / FILTER
// ============================================================
function filterTable() {
  const q = $('searchInput').value.trim().toLowerCase();
  if (!q) { renderTable(members); return; }
  const filtered = members.filter(m =>
    [m.fullName, m.mobile, m.area, m.occupation, m.samparkaGatanayak, m.samparkaRefrence, m.samparkaStatus]
      .some(v => v && String(v).toLowerCase().includes(q))
  );
  renderTable(filtered);
}

// ============================================================
// MODAL – OPEN / CLOSE
// ============================================================
function openModal(mode, id) {
  const modal = $('memberModal');
  $('memberForm').reset();
  $('memberId').value = '';

  if (mode === 'edit' && id) {
    const m = members.find(x => x.id === id);
    if (!m) return;

    // Non-admin editing: show hint about restricted fields
    if (!isAdminLoggedIn) {
      $('modalTitle').textContent = '🔄 Fill Missing Information';
      $('saveBtn').textContent    = '💾 Save Missing Info';
    } else {
      $('modalTitle').textContent = '✏️ Update Member';
      $('saveBtn').textContent    = '💾 Update Member';
    }

    $('memberId').value            = m.id;
    $('fullName').value            = m.fullName             || '';
    $('age').value                 = m.age                  || '';
    $('mobile').value              = m.mobile               || '';
    $('area').value                = m.area                 || '';
    $('occupation').value          = m.occupation           || '';
    $('dob').value                 = m.dob                  || '';
    $('samparkaGatanayak').value   = m.samparkaGatanayak    || '';
    $('samparkaRefrence').value    = m.samparkaRefrence     || '';
    $('address').value             = m.address              || '';
    $('samparkaStatus').value      = m.samparkaStatus       || '';

    // For non-admin, hide fields that already have data (they can only fill empty ones)
    if (!isAdminLoggedIn) {
      const fieldMap = {
        fullName:          'formGroupFullName',
        age:               'formGroupAge',
        mobile:            'formGroupMobile',
        area:              'formGroupArea',
        occupation:        'formGroupOccupation',
        dob:               'formGroupDob',
        samparkaGatanayak: 'formGroupSamparkaGatanayak',
        samparkaRefrence:  'formGroupSamparkaRefrence',
        address:           'formGroupAddress',
      };

      for (const [key, groupId] of Object.entries(fieldMap)) {
        const origVal = (m[key] || '').toString().trim();
        const groupEl = document.getElementById(groupId);
        if (origVal !== '' && groupEl) {
          groupEl.style.display = 'none';
        } else if (groupEl) {
          groupEl.style.display = '';
        }
      }
      // samparkaStatus is always visible and editable
    } else {
      // Admin: show all fields
      document.querySelectorAll('.form-group-toggle').forEach(el => el.style.display = '');
    }
  } else {
    $('modalTitle').textContent = '➕ Add New Member';
    $('saveBtn').textContent    = '💾 Save Member';
    // Show all fields for adding
    document.querySelectorAll('.form-group-toggle').forEach(el => el.style.display = '');
  }

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => $('fullName').focus(), 100);
}

function closeModal() {
  $('memberModal').classList.remove('open');
  document.body.style.overflow = '';
}

function closeModalOnOverlay(e) {
  if (e.target === $('memberModal')) closeModal();
}

// ============================================================
// SAVE MEMBER (Add / Edit)
// ============================================================
function saveMember(e) {
  e.preventDefault();

  const id = $('memberId').value;

  // 🔐 Non-admin editing: only allow filling in previously empty fields
  // BUT samparkaStatus is always editable by everyone
  if (id && !isAdminLoggedIn) {
    const original = members.find(m => m.id === id);
    if (!original) {
      showToast('⚠️ Member not found.', 'error');
      closeModal();
      return;
    }

    const fieldsToCheck = [
      { key: 'fullName',          label: 'Full Name' },
      { key: 'age',               label: 'Age' },
      { key: 'mobile',            label: 'Mobile Number' },
      { key: 'area',              label: 'Nagara' },
      { key: 'occupation',        label: 'Occupation' },
      { key: 'dob',               label: 'Date of Birth' },
      { key: 'samparkaGatanayak', label: 'Samparka Gatanayak' },
      { key: 'samparkaRefrence',  label: 'Samparka Refrence' },
      { key: 'address',           label: 'Full Address' },
    ];

    const formEls = {
      fullName:          $('fullName'),
      age:               $('age'),
      mobile:            $('mobile'),
      area:              $('area'),
      occupation:        $('occupation'),
      dob:               $('dob'),
      samparkaGatanayak: $('samparkaGatanayak'),
      samparkaRefrence:  $('samparkaRefrence'),
      address:           $('address'),
      samparkaStatus:    $('samparkaStatus'),
    };

    const blockedFields = [];

    // Build merged data: keep original if field was already filled
    const mergedData = {};

    for (const f of fieldsToCheck) {
      const origVal = (original[f.key] || '').trim();
      const newVal  = formEls[f.key].value.trim();

      if (origVal !== '' && origVal !== newVal) {
        // User tried to change a field that already had data — block it
        mergedData[f.key] = origVal;
        formEls[f.key].value = origVal;
        blockedFields.push(f.label);
      } else if (origVal === '' && newVal !== '') {
        // Field was empty — allow filling it in
        mergedData[f.key] = newVal;
      } else {
        // Both same or both empty — keep original
        mergedData[f.key] = origVal || newVal;
      }
    }

    // samparkaStatus is always editable by anyone
    mergedData.samparkaStatus = formEls.samparkaStatus.value.trim();

    // Apply the merged update
    const idx = members.findIndex(m => m.id === id);
    if (idx > -1) {
      members[idx] = {
        ...members[idx],
        ...mergedData,
        updatedOn: new Date().toISOString(),
      };
    }

    saveToStorage();
    closeModal();
    filterTable();

    if (blockedFields.length > 0) {
      showToast('⚠️ Only empty fields & Status can be updated. Protected: ' + blockedFields.join(', '), 'error');
    } else {
      showToast('✅ Member updated successfully!', 'success');
    }
    return;
  }

  // --- Admin editing or new member (no id) ---
  const data = {
    id:                  id || uid(),
    fullName:            $('fullName').value.trim(),
    age:                 $('age').value.trim(),
    mobile:              $('mobile').value.trim(),
    area:                $('area').value.trim(),
    occupation:          $('occupation').value.trim(),
    samparkaGatanayak:   $('samparkaGatanayak').value.trim(),
    samparkaRefrence:    $('samparkaRefrence').value.trim(),
    samparkaStatus:      $('samparkaStatus').value.trim(),
    dob:                 $('dob').value,
    address:             $('address').value.trim(),
    addedOn:             id ? (members.find(m => m.id === id)?.addedOn || new Date().toISOString()) : new Date().toISOString(),
    updatedOn:           new Date().toISOString(),
  };

  if (id) {
    const idx = members.findIndex(m => m.id === id);
    if (idx > -1) members[idx] = data;
    showToast('✅ Member updated successfully!', 'success');
  } else {
    members.unshift(data);
    showToast('✅ Member added successfully!', 'success');
  }

  saveToStorage();
  closeModal();
  filterTable();
}

// ============================================================
// DELETE
// ============================================================
function openDeleteDialog(id) {
  // 🔐 Admin-only guard
  if (!isAdminLoggedIn) {
    showToast('🔐 Admin login required to delete members!', 'error');
    openLoginModal();
    return;
  }

  deleteTargetId = id;
  $('deleteDialog').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDeleteDialog() {
  deleteTargetId = null;
  $('deleteDialog').classList.remove('open');
  document.body.style.overflow = '';
}

function closeDeleteOnOverlay(e) {
  if (e.target === $('deleteDialog')) closeDeleteDialog();
}

function confirmDelete() {
  if (!deleteTargetId) return;
  members = members.filter(m => m.id !== deleteTargetId);
  saveToStorage();
  closeDeleteDialog();
  filterTable();
  showToast('🗑️ Member deleted.', 'error');
}

// ============================================================
// EXPORT TO EXCEL
// ============================================================
function exportToExcel() {
  // 🔐 Admin-only guard
  if (!isAdminLoggedIn) {
    showToast('🔐 Admin login required to download Excel!', 'error');
    openLoginModal();
    return;
  }
  if (members.length === 0) {
    showToast('⚠️ No members to export!', '');
    return;
  }

  // Build header row
  const headers = [
    'Sr. No.', 'Full Name', 'Date of Birth',
    'Age', 'Mobile Number',
    'Nagara', 'Occupation',
    'Samparka Gatanayak', 'Samparka Refrence', 'Full Address',
    'Status of Samparka', 'Added On', 'Last Updated'
  ];

  const rows = members.map((m, idx) => [
    idx + 1,
    m.fullName,
    m.dob                || '',
    m.age                || '',
    m.mobile             || '',
    m.area               || '',
    m.occupation         || '',
    m.samparkaGatanayak  || '',
    m.samparkaRefrence   || '',
    m.address            || '',
    m.samparkaStatus     || '',
    m.addedOn      ? new Date(m.addedOn).toLocaleString('en-IN')  : '',
    m.updatedOn    ? new Date(m.updatedOn).toLocaleString('en-IN') : '',
  ]);

  const worksheetData = [headers, ...rows];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(worksheetData);

  // Column widths
  ws['!cols'] = [
    { wch: 7 }, { wch: 24 }, { wch: 14 },
    { wch: 6 }, { wch: 14 },
    { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 36 },
    { wch: 18 }, { wch: 22 }, { wch: 22 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Pramukha Nagarika Goshti');

  const fileName = `RSS_Pramukha_Nagarika_Goshti_${datestamp()}.xlsx`;
  XLSX.writeFile(wb, fileName);
  showToast(`📥 Excel downloaded: ${fileName}`, 'success');
}

function datestamp() {
  const d = new Date();
  return `${d.getDate().toString().padStart(2,'0')}${(d.getMonth()+1).toString().padStart(2,'0')}${d.getFullYear()}`;
}

// ============================================================
// INLINE STATUS UPDATE (from table dropdown)
// ============================================================
function updateStatus(id, newValue) {
  const m = members.find(m => m.id === id);
  if (!m) return;
  m.samparkaStatus = newValue;
  m.updatedOn = new Date().toISOString();
  saveToStorage();
  showToast('✅ Status updated to "' + esc(newValue) + '"', 'success');
}

// ============================================================
// PHONE LOOKUP (non-admin)
// ============================================================
function lookupByPhone() {
  const phone = $('phoneSearchInput').value.trim();
  const resEl  = $('lookupResult');

  resEl.classList.add('hidden');

  if (!phone || phone.length !== 10 || !/^[0-9]{10}$/.test(phone)) {
    showToast('⚠️ Please enter a valid 10-digit mobile number.', 'error');
    return;
  }

  const m = members.find(m => m.mobile === phone);
  if (!m) {
    showToast('⚠️ Mobile number not registered.', 'error');
    return;
  }

  const selected = m.samparkaStatus || '';
  resEl.innerHTML = `
    <div class="lookup-card">
      <h4>${esc(m.fullName)}</h4>
      <table class="lookup-table">
        <tr><td>Status:</td><td>
          <select id="lookupStatus_${m.id}" onchange="updateStatus('${m.id}', this.value)" style="padding:4px 6px;border-radius:6px;border:1px solid #ccc;font-size:0.85rem;cursor:pointer;">
            <option value="">—</option>
            <option value="Samparka not done" ${selected === 'Samparka not done' ? 'selected' : ''}>Samparka not done</option>
            <option value="Samparka done" ${selected === 'Samparka done' ? 'selected' : ''}>Samparka done</option>
            <option value="Invitation given" ${selected === 'Invitation given' ? 'selected' : ''}>Invitation given</option>
            <option value="Follow up done" ${selected === 'Follow up done' ? 'selected' : ''}>Follow up done</option>
            <option value="Confirmed" ${selected === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="Not coming" ${selected === 'Not coming' ? 'selected' : ''}>Not coming</option>
          </select>
        </td></tr>
      </table>
      <button class="btn btn-primary" style="margin-top:8px;" onclick="openModal('edit','${m.id}')">🔄 Fill Missing Info</button>
    </div>`;
  resEl.classList.remove('hidden');
}

// Handle enter key in phone search
document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && document.activeElement === $('phoneSearchInput')) {
    e.preventDefault();
    lookupByPhone();
  }
});

// ============================================================
// TOAST
// ============================================================
function showToast(msg, type = '') {
  const t = $('toast');
  t.textContent = msg;
  t.className   = 'toast' + (type ? ' ' + type : '');
  setTimeout(() => { t.className = 'toast hidden'; }, 3500);
}

// ============================================================
// ADMIN – LOGIN MODAL OPEN / CLOSE
// ============================================================
function openLoginModal() {
  $('loginForm').reset();
  $('loginError').classList.add('hidden');
  $('loginModal').classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => $('loginUser').focus(), 100);
}

function closeLoginModal() {
  $('loginModal').classList.remove('open');
  document.body.style.overflow = '';
}

function closeLoginOnOverlay(e) {
  if (e.target === $('loginModal')) closeLoginModal();
}

// ============================================================
// ADMIN – DO LOGIN
// ============================================================
function doLogin(e) {
  e.preventDefault();
  const user = $('loginUser').value.trim();
  const pass = $('loginPass').value;

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    isAdminLoggedIn = true;
    sessionStorage.setItem('rss_admin', 'true');
    closeLoginModal();
    applyAdminUI();
    showToast('🛡️ Admin logged in successfully!', 'success');
  } else {
    $('loginError').classList.remove('hidden');
    $('loginPass').value = '';
    $('loginPass').focus();
  }
}

// ============================================================
// ADMIN – LOGOUT
// ============================================================
function adminLogout() {
  isAdminLoggedIn = false;
  sessionStorage.removeItem('rss_admin');
  applyAdminUI();
  showToast('👋 Admin logged out.', '');
}

// ============================================================
// ADMIN – SHOW/HIDE PASSWORD TOGGLE
// ============================================================
function togglePassVis() {
  const inp = $('loginPass');
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

// ============================================================
// ADMIN – APPLY UI STATE (show/hide Excel button & badge)
// ============================================================
function applyAdminUI() {
  const excelBtn      = $('excelBtn');
  const lockMsg       = $('lockMsg');
  const adminBtn      = $('adminLoginBtn');
  const adminBadge    = $('adminBadge');
  const tableWrapper  = $('tableWrapper');
  const phoneLookup   = $('phoneLookup');
  const adminSearchBox= $('adminSearchBox');

  if (isAdminLoggedIn) {
    excelBtn.style.display       = 'inline-flex';
    lockMsg.classList.add('hidden');
    adminBtn.style.display       = 'none';
    adminBadge.classList.remove('hidden');
    if (tableWrapper)    tableWrapper.style.display = '';
    if (phoneLookup)     phoneLookup.style.display = 'none';
    if (adminSearchBox)  adminSearchBox.style.display = '';
  } else {
    excelBtn.style.display       = 'none';
    lockMsg.classList.remove('hidden');
    adminBtn.style.display       = '';
    adminBadge.classList.add('hidden');
    if (tableWrapper)    tableWrapper.style.display = 'none';
    if (phoneLookup)     phoneLookup.style.display = '';
    if (adminSearchBox)  adminSearchBox.style.display = 'none';
  }

  // Re-render table to reflect admin-only action buttons
  filterTable();
}

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal();
    closeDeleteDialog();
    closeLoginModal();
  }
});

// ============================================================
// INIT
// ============================================================
(function init() {
  renderTable(members);
  applyAdminUI();

  // Clicking the lock message also opens the login modal
  const lockMsg = $('lockMsg');
  if (lockMsg) lockMsg.addEventListener('click', openLoginModal);
})();