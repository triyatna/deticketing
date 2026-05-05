<template>
  <div
    :class="['registration-page', textureClass]"
    :style="registrationBackgroundStyle"
  >
    <div v-if="pending" class="text-center py-8">Memuat Event...</div>
    <div v-else-if="error || !event" class="error-container">
      <div class="glass-panel error-card text-center">
        <div class="error-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
            <line x1="9" y1="14" x2="15" y2="20"></line>
            <line x1="15" y1="14" x2="9" y2="20"></line>
          </svg>
        </div>
        <h2 class="error-title">Event Tidak Ditemukan</h2>
        <p class="text-muted error-desc">
          Maaf, halaman pendaftaran yang Anda cari tidak tersedia, URL mungkin
          salah, atau event telah dihapus oleh penyelenggara.
        </p>
      </div>
    </div>

    <div v-else-if="isSuccess" class="container pt-8">
      <div
        class="glass-panel max-w-3xl mx-auto text-center"
        style="padding: 4rem 2rem; border-radius: 20px"
      >
        <div
          style="
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: rgba(34, 197, 94, 0.1);
            color: #22c55e;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
            box-shadow: inset 0 0 0 1px rgba(34, 197, 94, 0.2);
          "
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <h2
          class="gradient-text mb-4"
          style="font-size: 2.2rem; font-weight: 800"
        >
          Pendaftaran Berhasil!
        </h2>
        <p
          class="text-muted"
          style="
            font-size: 1.05rem;
            line-height: 1.7;
            max-width: 480px;
            margin: 0 auto;
          "
        >
          Terima kasih telah mendaftar. Data Anda telah kami terima dengan baik.
          Silakan tunggu informasi dan konfirmasi lebih lanjut dari panitia.
          E-Ticket akan dikirimkan ke email Anda jika pendaftaran telah
          disetujui.
        </p>
      </div>

      <footer class="form-footer">
        <NuxtLink to="/" class="brand">
          <img
            v-if="appLogoUrl"
            :src="appLogoUrl"
            :alt="appName"
            class="landing-logo"
          />
          <span v-else class="gradient-text brand-name">{{ appName }}</span>
        </NuxtLink>
        <p class="copyright">
          Copyright &copy; 2026 TY Studio DEV. Allright reserved.
        </p>
      </footer>
    </div>

    <div v-else-if="deviceGatePending" class="container pt-8">
      <div
        class="glass-panel max-w-3xl mx-auto text-center"
        style="padding: 3rem 2rem; border-radius: 20px"
      >
        <h2
          class="gradient-text mb-4"
          style="font-size: 1.8rem; font-weight: 800"
        >
          Memverifikasi Pendaftaran...
        </h2>
        <p
          class="text-muted"
          style="
            font-size: 1rem;
            line-height: 1.6;
            max-width: 460px;
            margin: 0 auto;
          "
        >
          Mohon tunggu sebentar, sistem sedang mengecek status pendaftaran
          perangkat Anda.
        </p>
      </div>
    </div>

    <div v-else-if="isSubmitting" class="container pt-8">
      <div
        class="glass-panel max-w-3xl mx-auto text-center"
        style="padding: 4rem 2rem; border-radius: 20px"
      >
        <div
          style="margin: 0 auto 1.5rem; display: flex; justify-content: center"
        >
          <svg
            class="btn-spinner"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style="width: 60px; height: 60px; color: #3b82f6"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="3"
              stroke-dasharray="32"
              stroke-dashoffset="12"
            />
          </svg>
        </div>
        <h2
          class="gradient-text mb-4"
          style="font-size: 2.2rem; font-weight: 800"
        >
          Mengirim Data...
        </h2>
        <p
          class="text-muted"
          style="
            font-size: 1.05rem;
            line-height: 1.7;
            max-width: 480px;
            margin: 0 auto;
          "
        >
          Mohon tunggu sebentar, sistem sedang memproses pendaftaran dan
          mengunggah dokumen Anda dengan aman.
          <strong>Jangan menutup atau menyegarkan halaman ini.</strong>
        </p>
      </div>
    </div>

    <div v-else class="container pt-8">
      <div class="glass-panel max-w-3xl mx-auto registration-shell">
        <div class="event-header mb-8 text-center">
          <img
            v-if="headerImageUrl"
            :src="headerImageUrl"
            alt="Header Event"
            class="event-header-image"
          />
          <h1 class="gradient-text">{{ event.name }}</h1>
          <p
            class="text-muted mt-2 pre-wrap"
            v-html="formatDescription(event.description)"
          ></p>
          <div
            v-if="eventDate || eventLocation"
            class="event-meta-wrap mt-4"
            style="
              display: flex;
              flex-wrap: wrap;
              justify-content: center;
              gap: 1rem;
              color: #cbd5e1;
              font-weight: 500;
              font-size: 0.95rem;
            "
          >
            <div
              v-if="eventDate"
              class="event-meta-item"
              style="
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                background: rgba(255, 255, 255, 0.05);
                padding: 0.4rem 0.8rem;
                border-radius: 8px;
              "
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                style="width: 16px; height: 16px; color: #3b82f6"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <ClientOnly>
                {{ formattedEventDateTime }}
                <template #fallback>Memuat tanggal...</template>
              </ClientOnly>
            </div>
            <div
              v-if="eventLocation"
              class="event-meta-item"
              style="
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                background: rgba(255, 255, 255, 0.05);
                padding: 0.4rem 0.8rem;
                border-radius: 8px;
              "
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                style="width: 16px; height: 16px; color: #10b981"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              {{ eventLocation }}
            </div>
          </div>
          <div v-if="event.quota" class="mt-4 badge badge-gray">
            Kuota Tersisa: {{ availableQuota }}
          </div>
        </div>

        <div class="header-divider mb-8"></div>

        <div v-if="event.quota && availableQuota <= 0" class="alert error">
          Maaf, kuota pendaftaran untuk event ini telah penuh.
        </div>

        <div v-else-if="isDeadlinePassed" class="alert error">
          Pendaftaran untuk event ini sudah ditutup pada
          <ClientOnly>
            {{ registrationDeadlineLabel }}.
            <template #fallback>...</template>
          </ClientOnly>
        </div>

        <div v-else-if="isEventPassed" class="event-passed-container">
          <div class="passed-card glass-panel">
            <div class="passed-icon-wrap">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M18 6L6 18M6 6l12 12"></path>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <h2 class="passed-title gradient-text">Event Telah Berakhir</h2>
            <p class="passed-desc">
              Mohon maaf, periode pendaftaran untuk event
              <strong>{{ event.name }}</strong> telah ditutup karena waktu
              pelaksanaan event sudah terlewat atau selesai.
            </p>
            <div class="passed-actions">
              <button @click="handleCloseTab" class="btn-outline">
                Kembali
              </button>
            </div>
          </div>
        </div>

        <form
          v-else
          @submit.prevent="submitRegistration"
          class="registration-form"
        >
          <section class="form-card">
            <!-- Multi-Ticket Mode Toggle -->
            <div v-if="allowMultiTicket" class="mode-toggle-section mb-4">
              <label class="toggle-card" :class="{ active: isMultiTicketMode }">
                <input
                  type="checkbox"
                  v-model="isMultiTicketMode"
                  class="hidden-check"
                />
                <div class="toggle-info">
                  <div class="toggle-icon">
                    <svg
                      v-if="!isMultiTicketMode"
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path
                        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                      ></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <svg
                      v-else
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path
                        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                      ></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>
                  <div class="toggle-text">
                    <span class="toggle-title">Daftar untuk Rombongan?</span>
                    <span class="toggle-desc"
                      >Pilih ini jika Anda ingin memesan lebih dari 1 tiket
                      sekaligus.</span
                    >
                  </div>
                </div>
                <div class="toggle-status">
                  <div class="status-indicator"></div>
                </div>
              </label>
            </div>

            <!-- Multi-Ticket Selection (Only if mode enabled) -->
            <div
              v-if="allowMultiTicket && isMultiTicketMode"
              class="quantity-section mb-6"
            >
              <label class="section-label">Jumlah Tiket yang Dipesan</label>
              <div class="quantity-selector">
                <button
                  type="button"
                  @click="ticketQuantity > 2 && ticketQuantity--"
                  class="qty-btn"
                  :disabled="ticketQuantity <= 2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
                <div class="qty-display">
                  <span class="qty-num">{{ ticketQuantity }}</span>
                  <span class="qty-text">Tiket</span>
                </div>
                <button
                  type="button"
                  @click="
                    ticketQuantity < (maxTicketsPerOrder || 999) &&
                    ticketQuantity++
                  "
                  class="qty-btn"
                  :disabled="
                    maxTicketsPerOrder > 0 &&
                    ticketQuantity >= maxTicketsPerOrder
                  "
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
              </div>
              <p v-if="maxTicketsPerOrder > 0" class="qty-hint">
                Maksimal {{ maxTicketsPerOrder }} tiket per pesanan.
              </p>
            </div>

            <!-- Participant Data Section -->
            <div v-if="isMultiTicketMode" class="participants-section mb-6">
              <label class="section-label">Data Peserta Rombongan</label>

              <!-- Peserta Utama -->
              <div class="participant-card primary">
                <div class="participant-badge">Peserta 1 (Utama)</div>
                <div class="form-group mb-0">
                  <label>Nama Lengkap <span class="text-red">*</span></label>
                  <input
                    v-model="form.registrantName"
                    type="text"
                    class="form-input input-capitalize"
                    required
                    placeholder="Contoh: John Doe"
                  />
                </div>

                <!-- Participant-specific Questions (Enable Multi) -->
                <template v-for="q in questionItems" :key="'p1_' + q.id">
                  <div
                    v-if="q.enableMulti"
                    class="form-group dynamic-item multi-participant-item mt-3"
                  >
                    <label>
                      {{ q.label }}
                      <span v-if="q.required" class="text-red">*</span>
                    </label>
                    <p v-if="q.description" class="field-desc">
                      {{ q.description }}
                    </p>

                    <input
                      v-if="q.questionType === 'short_answer'"
                      v-model="answers[getAnswerId(q.id, 0)]"
                      type="text"
                      class="form-input"
                      :required="q.required"
                    />

                    <textarea
                      v-else-if="q.questionType === 'paragraph'"
                      v-model="answers[getAnswerId(q.id, 0)]"
                      class="form-input"
                      rows="4"
                      :required="q.required"
                    ></textarea>

                    <div
                      v-else-if="q.questionType === 'multiple_choice'"
                      class="radio-group"
                    >
                      <label
                        v-for="opt in q.options"
                        :key="opt"
                        class="radio-label"
                      >
                        <input
                          type="radio"
                          :name="`mc_${getAnswerId(q.id, 0)}`"
                          :value="opt"
                          v-model="answers[getAnswerId(q.id, 0)]"
                        />
                        {{ opt }}
                      </label>
                    </div>

                    <div
                      v-else-if="q.questionType === 'checkboxes'"
                      class="radio-group"
                    >
                      <label
                        v-for="opt in q.options"
                        :key="opt"
                        class="radio-label"
                      >
                        <input
                          type="checkbox"
                          :checked="isChecked(getAnswerId(q.id, 0), opt)"
                          @change="
                            toggleCheckbox(
                              getAnswerId(q.id, 0),
                              opt,
                              $event.target.checked,
                            )
                          "
                        />
                        {{ opt }}
                      </label>
                    </div>

                    <select
                      v-else-if="q.questionType === 'dropdown'"
                      v-model="answers[getAnswerId(q.id, 0)]"
                      class="form-input"
                      :required="q.required"
                    >
                      <option value="">-- Pilih --</option>
                      <option v-for="opt in q.options" :key="opt" :value="opt">
                        {{ opt }}
                      </option>
                    </select>

                    <div
                      v-else-if="q.questionType === 'file_upload'"
                      class="file-wrap"
                    >
                      <input
                        type="file"
                        class="form-input"
                        @change="
                          handleDynamicFileUpload(getAnswerId(q.id, 0), $event)
                        "
                      />
                      <p
                        v-if="fileAnswers[getAnswerId(q.id, 0)]"
                        class="file-note"
                      >
                        {{ fileAnswers[getAnswerId(q.id, 0)].name }}
                      </p>
                    </div>

                    <div
                      v-else-if="q.questionType === 'linear_scale'"
                      class="scale-wrap"
                    >
                      <div class="scale-options">
                        <label
                          v-for="num in scaleRange(q.scaleMin, q.scaleMax)"
                          :key="`scale-${q.id}-0-${num}`"
                          class="scale-option"
                        >
                          <input
                            type="radio"
                            :name="`scale_${getAnswerId(q.id, 0)}`"
                            :value="String(num)"
                            v-model="answers[getAnswerId(q.id, 0)]"
                          />
                          <span>{{ num }}</span>
                        </label>
                      </div>
                      <div class="scale-labels">
                        <span>{{ q.scaleMinLabel || q.scaleMin }}</span>
                        <span>{{ q.scaleMaxLabel || q.scaleMax }}</span>
                      </div>
                    </div>

                    <div
                      v-else-if="q.questionType === 'rating'"
                      class="rating-wrap"
                    >
                      <label
                        v-for="num in ratingRange(q.ratingMax)"
                        :key="`rating-${q.id}-0-${num}`"
                        class="rating-option"
                      >
                        <input
                          type="radio"
                          :name="`rating_${getAnswerId(q.id, 0)}`"
                          :value="String(num)"
                          v-model="answers[getAnswerId(q.id, 0)]"
                        />
                        <span>{{ num }}</span>
                      </label>
                    </div>

                    <div
                      v-else-if="q.questionType === 'multiple_choice_grid'"
                      class="grid-wrap"
                    >
                      <table class="grid-table">
                        <thead>
                          <tr>
                            <th></th>
                            <th
                              v-for="col in q.gridCols"
                              :key="`${q.id}-mc-col-${col}`"
                            >
                              {{ col }}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="row in q.gridRows"
                            :key="`${q.id}-mc-row-${row}`"
                          >
                            <td>{{ row }}</td>
                            <td
                              v-for="col in q.gridCols"
                              :key="`${q.id}-mc-${row}-${col}`"
                            >
                              <input
                                type="radio"
                                :name="`grid_mc_${getAnswerId(q.id, 0)}_${row}`"
                                :checked="
                                  getGridChoice(getAnswerId(q.id, 0), row) ===
                                  col
                                "
                                @change="
                                  setGridChoice(getAnswerId(q.id, 0), row, col)
                                "
                              />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div
                      v-else-if="q.questionType === 'checkbox_grid'"
                      class="grid-wrap"
                    >
                      <table class="grid-table">
                        <thead>
                          <tr>
                            <th></th>
                            <th
                              v-for="col in q.gridCols"
                              :key="`${q.id}-cb-col-${col}`"
                            >
                              {{ col }}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="row in q.gridRows"
                            :key="`${q.id}-cb-row-${row}`"
                          >
                            <td>{{ row }}</td>
                            <td
                              v-for="col in q.gridCols"
                              :key="`${q.id}-cb-${row}-${col}`"
                            >
                              <input
                                type="checkbox"
                                :checked="
                                  isGridChecked(getAnswerId(q.id, 0), row, col)
                                "
                                @change="
                                  toggleGridCheckbox(
                                    getAnswerId(q.id, 0),
                                    row,
                                    col,
                                    $event.target.checked,
                                  )
                                "
                              />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <input
                      v-else-if="q.questionType === 'date'"
                      v-model="answers[getAnswerId(q.id, 0)]"
                      type="date"
                      class="form-input"
                      :required="q.required"
                    />

                    <input
                      v-else-if="q.questionType === 'time'"
                      v-model="answers[getAnswerId(q.id, 0)]"
                      type="time"
                      class="form-input"
                      :required="q.required"
                    />
                  </div>
                </template>
              </div>

              <!-- Peserta Tambahan -->
              <div
                v-for="(name, idx) in additionalNames"
                :key="idx"
                class="participant-card mt-3"
              >
                <div class="participant-badge">Peserta {{ idx + 2 }}</div>
                <div class="form-group mb-0">
                  <label>Nama Lengkap <span class="text-red">*</span></label>
                  <input
                    v-model="additionalNames[idx]"
                    type="text"
                    class="form-input input-capitalize"
                    required
                    :placeholder="`Nama peserta ke-${idx + 2}`"
                  />
                </div>

                <!-- Participant-specific Questions (Enable Multi) -->
                <template
                  v-for="q in questionItems"
                  :key="'p' + (idx + 2) + '_' + q.id"
                >
                  <div
                    v-if="q.enableMulti"
                    class="form-group dynamic-item multi-participant-item mt-3"
                  >
                    <label>
                      {{ q.label }}
                      <span v-if="q.required" class="text-red">*</span>
                    </label>
                    <p v-if="q.description" class="field-desc">
                      {{ q.description }}
                    </p>

                    <input
                      v-if="q.questionType === 'short_answer'"
                      v-model="answers[getAnswerId(q.id, idx + 1)]"
                      type="text"
                      class="form-input"
                      :required="q.required"
                    />

                    <textarea
                      v-else-if="q.questionType === 'paragraph'"
                      v-model="answers[getAnswerId(q.id, idx + 1)]"
                      class="form-input"
                      rows="4"
                      :required="q.required"
                    ></textarea>

                    <div
                      v-else-if="q.questionType === 'multiple_choice'"
                      class="radio-group"
                    >
                      <label
                        v-for="opt in q.options"
                        :key="opt"
                        class="radio-label"
                      >
                        <input
                          type="radio"
                          :name="`mc_${getAnswerId(q.id, idx + 1)}`"
                          :value="opt"
                          v-model="answers[getAnswerId(q.id, idx + 1)]"
                        />
                        {{ opt }}
                      </label>
                    </div>

                    <div
                      v-else-if="q.questionType === 'checkboxes'"
                      class="radio-group"
                    >
                      <label
                        v-for="opt in q.options"
                        :key="opt"
                        class="radio-label"
                      >
                        <input
                          type="checkbox"
                          :checked="isChecked(getAnswerId(q.id, idx + 1), opt)"
                          @change="
                            toggleCheckbox(
                              getAnswerId(q.id, idx + 1),
                              opt,
                              $event.target.checked,
                            )
                          "
                        />
                        {{ opt }}
                      </label>
                    </div>

                    <select
                      v-else-if="q.questionType === 'dropdown'"
                      v-model="answers[getAnswerId(q.id, idx + 1)]"
                      class="form-input"
                      :required="q.required"
                    >
                      <option value="">-- Pilih --</option>
                      <option v-for="opt in q.options" :key="opt" :value="opt">
                        {{ opt }}
                      </option>
                    </select>

                    <div
                      v-else-if="q.questionType === 'file_upload'"
                      class="file-wrap"
                    >
                      <input
                        type="file"
                        class="form-input"
                        @change="
                          handleDynamicFileUpload(
                            getAnswerId(q.id, idx + 1),
                            $event,
                          )
                        "
                      />
                      <p
                        v-if="fileAnswers[getAnswerId(q.id, idx + 1)]"
                        class="file-note"
                      >
                        {{ fileAnswers[getAnswerId(q.id, idx + 1)].name }}
                      </p>
                    </div>

                    <div
                      v-else-if="q.questionType === 'linear_scale'"
                      class="scale-wrap"
                    >
                      <div class="scale-options">
                        <label
                          v-for="num in scaleRange(q.scaleMin, q.scaleMax)"
                          :key="`scale-${q.id}-${idx + 1}-${num}`"
                          class="scale-option"
                        >
                          <input
                            type="radio"
                            :name="`scale_${getAnswerId(q.id, idx + 1)}`"
                            :value="String(num)"
                            v-model="answers[getAnswerId(q.id, idx + 1)]"
                          />
                          <span>{{ num }}</span>
                        </label>
                      </div>
                      <div class="scale-labels">
                        <span>{{ q.scaleMinLabel || q.scaleMin }}</span>
                        <span>{{ q.scaleMaxLabel || q.scaleMax }}</span>
                      </div>
                    </div>

                    <div
                      v-else-if="q.questionType === 'rating'"
                      class="rating-wrap"
                    >
                      <label
                        v-for="num in ratingRange(q.ratingMax)"
                        :key="`rating-${q.id}-${idx + 1}-${num}`"
                        class="rating-option"
                      >
                        <input
                          type="radio"
                          :name="`rating_${getAnswerId(q.id, idx + 1)}`"
                          :value="String(num)"
                          v-model="answers[getAnswerId(q.id, idx + 1)]"
                        />
                        <span>{{ num }}</span>
                      </label>
                    </div>

                    <div
                      v-else-if="q.questionType === 'multiple_choice_grid'"
                      class="grid-wrap"
                    >
                      <table class="grid-table">
                        <thead>
                          <tr>
                            <th></th>
                            <th
                              v-for="col in q.gridCols"
                              :key="`${q.id}-mc-col-${col}`"
                            >
                              {{ col }}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="row in q.gridRows"
                            :key="`${q.id}-mc-row-${row}`"
                          >
                            <td>{{ row }}</td>
                            <td
                              v-for="col in q.gridCols"
                              :key="`${q.id}-mc-${row}-${col}`"
                            >
                              <input
                                type="radio"
                                :name="`grid_mc_${getAnswerId(q.id, idx + 1)}_${row}`"
                                :checked="
                                  getGridChoice(
                                    getAnswerId(q.id, idx + 1),
                                    row,
                                  ) === col
                                "
                                @change="
                                  setGridChoice(
                                    getAnswerId(q.id, idx + 1),
                                    row,
                                    col,
                                  )
                                "
                              />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div
                      v-else-if="q.questionType === 'checkbox_grid'"
                      class="grid-wrap"
                    >
                      <table class="grid-table">
                        <thead>
                          <tr>
                            <th></th>
                            <th
                              v-for="col in q.gridCols"
                              :key="`${q.id}-cb-col-${col}`"
                            >
                              {{ col }}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="row in q.gridRows"
                            :key="`${q.id}-cb-row-${row}`"
                          >
                            <td>{{ row }}</td>
                            <td
                              v-for="col in q.gridCols"
                              :key="`${q.id}-cb-${row}-${col}`"
                            >
                              <input
                                type="checkbox"
                                :checked="
                                  isGridChecked(
                                    getAnswerId(q.id, idx + 1),
                                    row,
                                    col,
                                  )
                                "
                                @change="
                                  toggleGridCheckbox(
                                    getAnswerId(q.id, idx + 1),
                                    row,
                                    col,
                                    $event.target.checked,
                                  )
                                "
                              />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <input
                      v-else-if="q.questionType === 'date'"
                      v-model="answers[getAnswerId(q.id, idx + 1)]"
                      type="date"
                      class="form-input"
                      :required="q.required"
                    />

                    <input
                      v-else-if="q.questionType === 'time'"
                      v-model="answers[getAnswerId(q.id, idx + 1)]"
                      type="time"
                      class="form-input"
                      :required="q.required"
                    />
                  </div>
                </template>
              </div>
            </div>

            <!-- Simple Design for Individual -->
            <div v-else class="static-grid mb-6">
              <div class="form-group">
                <label>Nama Lengkap <span class="text-red">*</span></label>
                <input
                  v-model="form.registrantName"
                  type="text"
                  class="form-input input-capitalize"
                  required
                  placeholder="Contoh: John Doe"
                />
              </div>
            </div>

            <div class="static-grid">
              <div class="form-group">
                <label
                  >Email Aktif (Untuk Pengiriman Tiket)
                  <span class="text-red">*</span></label
                >
                <input
                  v-model="form.registrantEmail"
                  type="email"
                  class="form-input"
                  required
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div class="dynamic-wrap">
              <template
                v-for="(item, index) in schemaItems"
                :key="item.id || index"
              >
                <div
                  v-if="item.itemType === 'heading'"
                  class="content-block heading-block"
                >
                  <h3>{{ item.title || "Judul" }}</h3>
                  <p v-if="item.description" class="text-muted pre-wrap">
                    {{ item.description }}
                  </p>
                </div>

                <div
                  v-else-if="item.itemType === 'section'"
                  class="content-block section-block"
                >
                  <hr />
                  <h4>{{ item.title || "Section" }}</h4>
                  <p v-if="item.description" class="text-muted pre-wrap">
                    {{ item.description }}
                  </p>
                </div>

                <div
                  v-else-if="item.itemType === 'image'"
                  class="content-block media-block"
                >
                  <img
                    v-if="item.imageUrl"
                    :src="item.imageUrl"
                    :alt="item.description || 'Gambar'"
                    class="content-image"
                  />
                  <div v-else class="media-empty">URL gambar belum diisi.</div>
                  <p v-if="item.description" class="text-muted pre-wrap">
                    {{ item.description }}
                  </p>
                </div>

                <div
                  v-else-if="item.itemType === 'video'"
                  class="content-block media-block"
                >
                  <iframe
                    v-if="toEmbedVideo(item.videoUrl)"
                    :src="toEmbedVideo(item.videoUrl)"
                    title="Video"
                    class="video-embed"
                    allow="
                      accelerometer;
                      autoplay;
                      clipboard-write;
                      encrypted-media;
                      gyroscope;
                      picture-in-picture;
                    "
                    allowfullscreen
                  ></iframe>
                  <a
                    v-else-if="item.videoUrl"
                    :href="item.videoUrl"
                    target="_blank"
                    class="video-link"
                  >
                    Buka Video
                  </a>
                  <div v-else class="media-empty">URL video belum diisi.</div>
                  <p v-if="item.description" class="text-muted pre-wrap">
                    {{ item.description }}
                  </p>
                </div>

                <template
                  v-if="
                    item.itemType === 'question' &&
                    !(isMultiTicketMode && item.enableMulti)
                  "
                >
                  <div
                    v-for="pIdx in [0]"
                    :key="item.id"
                    class="form-group dynamic-item"
                  >
                    <label>
                      {{ item.label || `Pertanyaan ${index + 1}` }}
                      <span v-if="item.required" class="text-red">*</span>
                    </label>
                    <p v-if="item.description" class="field-desc">
                      {{ item.description }}
                    </p>

                    <input
                      v-if="item.questionType === 'short_answer'"
                      v-model="answers[getAnswerId(item.id, pIdx - 1)]"
                      type="text"
                      class="form-input"
                      :required="item.required"
                    />

                    <textarea
                      v-else-if="item.questionType === 'paragraph'"
                      v-model="answers[getAnswerId(item.id, pIdx - 1)]"
                      class="form-input"
                      rows="4"
                      :required="item.required"
                    ></textarea>

                    <div
                      v-else-if="item.questionType === 'multiple_choice'"
                      class="radio-group"
                    >
                      <label
                        v-for="opt in item.options"
                        :key="opt"
                        class="radio-label"
                      >
                        <input
                          type="radio"
                          :name="`mc_${getAnswerId(item.id, pIdx - 1)}`"
                          :value="opt"
                          v-model="answers[getAnswerId(item.id, pIdx - 1)]"
                        />
                        {{ opt }}
                      </label>
                    </div>

                    <div
                      v-else-if="item.questionType === 'checkboxes'"
                      class="radio-group"
                    >
                      <label
                        v-for="opt in item.options"
                        :key="opt"
                        class="radio-label"
                      >
                        <input
                          type="checkbox"
                          :checked="
                            isChecked(getAnswerId(item.id, pIdx - 1), opt)
                          "
                          @change="
                            toggleCheckbox(
                              getAnswerId(item.id, pIdx - 1),
                              opt,
                              $event.target.checked,
                            )
                          "
                        />
                        {{ opt }}
                      </label>
                    </div>

                    <select
                      v-else-if="item.questionType === 'dropdown'"
                      v-model="answers[getAnswerId(item.id, pIdx - 1)]"
                      class="form-input"
                      :required="item.required"
                    >
                      <option value="">-- Pilih --</option>
                      <option
                        v-for="opt in item.options"
                        :key="opt"
                        :value="opt"
                      >
                        {{ opt }}
                      </option>
                    </select>

                    <div
                      v-else-if="item.questionType === 'file_upload'"
                      class="file-wrap"
                    >
                      <input
                        type="file"
                        class="form-input"
                        @change="
                          handleDynamicFileUpload(
                            getAnswerId(item.id, pIdx - 1),
                            $event,
                          )
                        "
                      />
                      <p
                        v-if="fileAnswers[getAnswerId(item.id, pIdx - 1)]"
                        class="file-note"
                      >
                        {{ fileAnswers[getAnswerId(item.id, pIdx - 1)].name }}
                      </p>
                    </div>

                    <div
                      v-else-if="item.questionType === 'linear_scale'"
                      class="scale-wrap"
                    >
                      <div class="scale-options">
                        <label
                          v-for="num in scaleRange(
                            item.scaleMin,
                            item.scaleMax,
                          )"
                          :key="`scale-${item.id}-${pIdx}-${num}`"
                          class="scale-option"
                        >
                          <input
                            type="radio"
                            :name="`scale_${getAnswerId(item.id, pIdx - 1)}`"
                            :value="String(num)"
                            v-model="answers[getAnswerId(item.id, pIdx - 1)]"
                          />
                          <span>{{ num }}</span>
                        </label>
                      </div>
                      <div class="scale-labels">
                        <span>{{ item.scaleMinLabel || item.scaleMin }}</span>
                        <span>{{ item.scaleMaxLabel || item.scaleMax }}</span>
                      </div>
                    </div>

                    <div
                      v-else-if="item.questionType === 'rating'"
                      class="rating-wrap"
                    >
                      <label
                        v-for="num in ratingRange(item.ratingMax)"
                        :key="`rating-${item.id}-${pIdx}-${num}`"
                        class="rating-option"
                      >
                        <input
                          type="radio"
                          :name="`rating_${getAnswerId(item.id, pIdx - 1)}`"
                          :value="String(num)"
                          v-model="answers[getAnswerId(item.id, pIdx - 1)]"
                        />
                        <span>{{ num }}</span>
                      </label>
                    </div>

                    <div
                      v-else-if="item.questionType === 'multiple_choice_grid'"
                      class="grid-wrap"
                    >
                      <table class="grid-table">
                        <thead>
                          <tr>
                            <th></th>
                            <th
                              v-for="col in item.gridCols"
                              :key="`${item.id}-mc-col-${col}`"
                            >
                              {{ col }}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="row in item.gridRows"
                            :key="`${item.id}-mc-row-${row}`"
                          >
                            <td>{{ row }}</td>
                            <td
                              v-for="col in item.gridCols"
                              :key="`${item.id}-mc-${row}-${col}`"
                            >
                              <input
                                type="radio"
                                :name="`grid_mc_${getAnswerId(item.id, pIdx - 1)}_${row}`"
                                :checked="
                                  getGridChoice(
                                    getAnswerId(item.id, pIdx - 1),
                                    row,
                                  ) === col
                                "
                                @change="
                                  setGridChoice(
                                    getAnswerId(item.id, pIdx - 1),
                                    row,
                                    col,
                                  )
                                "
                              />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div
                      v-else-if="item.questionType === 'checkbox_grid'"
                      class="grid-wrap"
                    >
                      <table class="grid-table">
                        <thead>
                          <tr>
                            <th></th>
                            <th
                              v-for="col in item.gridCols"
                              :key="`${item.id}-cb-col-${col}`"
                            >
                              {{ col }}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="row in item.gridRows"
                            :key="`${item.id}-cb-row-${row}`"
                          >
                            <td>{{ row }}</td>
                            <td
                              v-for="col in item.gridCols"
                              :key="`${item.id}-cb-${row}-${col}`"
                            >
                              <input
                                type="checkbox"
                                :checked="
                                  isGridChecked(
                                    getAnswerId(item.id, pIdx - 1),
                                    row,
                                    col,
                                  )
                                "
                                @change="
                                  toggleGridCheckbox(
                                    getAnswerId(item.id, pIdx - 1),
                                    row,
                                    col,
                                    $event.target.checked,
                                  )
                                "
                              />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <input
                      v-else-if="item.questionType === 'date'"
                      v-model="answers[getAnswerId(item.id, pIdx - 1)]"
                      type="date"
                      class="form-input"
                      :required="item.required"
                    />

                    <input
                      v-else-if="item.questionType === 'time'"
                      v-model="answers[getAnswerId(item.id, pIdx - 1)]"
                      type="time"
                      class="form-input"
                      :required="item.required"
                    />
                  </div>
                </template>
              </template>
            </div>
          </section>

          <div
            v-if="isPaymentEnabled && paymentSettings.length"
            class="payment-box mt-4"
          >
            <h4>Instruksi Pembayaran</h4>

            <!-- Conditional Payment Summary -->
            <div v-if="eventNominal">
              <!-- Group Design (Billing Summary) -->
              <div v-if="ticketQuantity > 1" class="billing-summary mt-4">
                <div class="billing-item">
                  <span class="billing-label">Harga per Tiket</span>
                  <span class="billing-value">{{
                    formatPrice(eventNominal)
                  }}</span>
                </div>
                <div class="billing-item">
                  <span class="billing-label">Kuantitas Tiket</span>
                  <span class="billing-value">x {{ ticketQuantity }}</span>
                </div>
                <div class="billing-divider"></div>
                <div class="billing-footer">
                  <span class="total-label">Total Pembayaran</span>
                  <div class="total-wrap">
                    <span class="total-amount">{{
                      formatPrice(eventNominal * ticketQuantity)
                    }}</span>
                  </div>
                </div>
              </div>

              <!-- Individual Design (Previous Simple Design) -->
              <div v-else class="global-nominal-card mt-4">
                <span class="nominal-label">Total yang harus dibayar:</span>
                <strong class="nominal-value">{{
                  formatPrice(eventNominal)
                }}</strong>
              </div>
            </div>

            <div class="payment-methods">
              <article
                v-for="(method, methodIndex) in paymentSettings"
                :key="method.id || methodIndex"
                class="payment-method"
              >
                <div class="payment-method-head">
                  <strong>{{ method.label }}</strong>
                  <span class="payment-type">{{
                    paymentTypeLabel(method.type)
                  }}</span>
                </div>

                <p
                  v-if="method.type === 'qris' && method.qrisImageUrl"
                  class="text-muted"
                >
                  Scan QRIS berikut untuk melakukan pembayaran.
                </p>
                <div v-if="method.type === 'qris'" class="qris-wrapper mt-4">
                  <div class="qris-container">
                    <template v-if="dynamicQrisUrls[method.id]">
                      <img
                        :src="dynamicQrisUrls[method.id]"
                        :alt="`QRIS Dinamis ${method.label}`"
                        class="qris-image qris-dynamic"
                      />
                    </template>
                    <img
                      v-else-if="method.qrisImageUrl"
                      :src="method.qrisImageUrl"
                      :alt="`QRIS ${method.label}`"
                      class="qris-image"
                    />
                  </div>

                  <div class="qris-footer">
                    <p class="scan-instruction">
                      Scan QR untuk membayar otomatis
                    </p>
                    <button
                      type="button"
                      class="btn-download-qris"
                      @click="
                        downloadQris(
                          dynamicQrisUrls[method.id] || method.qrisImageUrl,
                          `QRIS-${method.label}`,
                        )
                      "
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <path
                          d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"
                        ></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      <span>Download QRIS</span>
                    </button>
                  </div>
                </div>

                <div v-else class="payment-details mt-2">
                  <div class="detail-row">
                    <span class="detail-label">Atas Nama</span>
                    <strong class="detail-value">{{
                      method.accountName
                    }}</strong>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">No. Rekening / Akun</span>
                    <div class="detail-value-wrap">
                      <strong class="detail-value highlight">{{
                        method.accountNumber
                      }}</strong>
                      <button
                        type="button"
                        class="btn-copy"
                        @click="copyToClipboard(method.accountNumber)"
                        title="Salin Nomor Rekening"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <rect
                            x="9"
                            y="9"
                            width="13"
                            height="13"
                            rx="2"
                            ry="2"
                          ></rect>
                          <path
                            d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                          ></path>
                        </svg>
                        <span>Salin</span>
                      </button>
                    </div>
                  </div>
                </div>

                <p v-if="method.note" class="text-muted text-sm">
                  {{ method.note }}
                </p>
              </article>
            </div>
          </div>

          <div
            v-if="
              isPaymentEnabled && event.requireProof && !paymentSettings.length
            "
            class="alert error mt-4"
          >
            Bukti transfer diwajibkan, tetapi konfigurasi metode pembayaran
            belum lengkap.
          </div>

          <div
            v-if="isPaymentEnabled && event.requireProof"
            class="form-group mt-4 p-4 border-dashed rounded proof-box"
          >
            <label
              >Bukti Pembayaran / Transfer (Gambar)
              <span class="text-red">*</span></label
            >
            <p class="text-muted text-sm mb-2">
              Unggah bukti transfer (JPG/PNG). Maks 2MB.
            </p>

            <div v-if="proofFileCache" class="proof-preview mb-3">
              <img
                :src="proofFileCache.dataUrl"
                alt="Bukti Transfer"
                class="proof-thumb"
              />
              <div class="proof-info">
                <span class="proof-name">{{ proofFileCache.name }}</span>
                <button
                  type="button"
                  class="proof-remove"
                  @click="removeProofCache"
                >
                  &times; Hapus
                </button>
              </div>
            </div>

            <input
              ref="proofInputRef"
              @change="handleProofUpload"
              type="file"
              accept="image/jpeg, image/png, image/webp"
              class="form-input"
              :required="!proofFileCache"
            />
          </div>

          <div class="form-actions mt-8">
            <button
              type="submit"
              class="btn-primary w-full submit-btn"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting" class="btn-spinner-wrap">
                <svg
                  class="btn-spinner"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-dasharray="32"
                    stroke-dashoffset="12"
                  />
                </svg>
                Memproses...
              </span>
              <span v-else>Kirim Pendaftaran</span>
            </button>
          </div>
        </form>
      </div>

      <footer class="form-footer">
        <NuxtLink to="/" class="brand">
          <img
            v-if="appLogoUrl"
            :src="appLogoUrl"
            :alt="appName"
            class="landing-logo"
          />
          <span v-else class="gradient-text brand-name">{{ appName }}</span>
        </NuxtLink>
        <p class="copyright">
          Copyright &copy; 2026 TY Studio DEV. Allright reserved.
        </p>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watchEffect, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import Swal from "sweetalert2";
import QRCode from "qrcode";

const route = useRoute();
const router = useRouter();
const { appName, appLogoUrl } = useBranding();
const slug = route.params.slug;

const DEVICE_CACHE_KEY = `form_device_meta_${slug}`;
const DEVICE_STATUS_CACHE_KEY = `form_device_status_${slug}`;
const DEVICE_STATUS_CACHE_TTL_MS = 20 * 1000;

const showAlert = (title, text, icon = "info") => {
  return Swal.fire({
    title,
    text,
    icon,
    background: "#0f172a",
    color: "#f8fafc",
    confirmButtonColor: "#3b82f6",
  });
};

const downloadQris = (url, filename) => {
  if (!url) return;
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const showToast = (title, icon = "success") => {
  return Swal.fire({
    title,
    icon,
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: "#0f172a",
    color: "#f8fafc",
  });
};

const toBase64Url = (bytes) => {
  const binary = String.fromCharCode(...bytes);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
};

const buildRawDeviceMeta = () => {
  if (!import.meta.client) return {};

  const nav = window.navigator;
  const scr = window.screen;
  const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
  const userAgentData = nav.userAgentData || null;
  const visualViewport = window.visualViewport || null;
  const cpuClass = nav.cpuClass || "";
  const oscpu = nav.oscpu || "";

  return {
    userAgent: nav.userAgent || "",
    userAgentData: userAgentData
      ? {
          platform: userAgentData.platform || "",
          mobile: !!userAgentData.mobile,
          brands: Array.isArray(userAgentData.brands)
            ? userAgentData.brands.map((brand) => ({
                brand: String(brand?.brand || ""),
                version: String(brand?.version || ""),
              }))
            : [],
        }
      : null,
    platform: nav.platform || "",
    vendor: nav.vendor || "",
    oscpu,
    cpuClass,
    language: nav.language || "",
    languages: Array.isArray(nav.languages) ? nav.languages : [],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    timeZoneOffsetMinutes: new Date().getTimezoneOffset(),
    screen: {
      width: scr?.width || 0,
      height: scr?.height || 0,
      availWidth: scr?.availWidth || 0,
      availHeight: scr?.availHeight || 0,
      colorDepth: scr?.colorDepth || 0,
      pixelDepth: scr?.pixelDepth || 0,
      pixelRatio: window.devicePixelRatio || 1,
    },
    viewport: {
      width: window.innerWidth || 0,
      height: window.innerHeight || 0,
    },
    visualViewport: visualViewport
      ? {
          width: Math.round(visualViewport.width || 0),
          height: Math.round(visualViewport.height || 0),
          scale: Number(visualViewport.scale || 1),
        }
      : null,
    urlContext: {
      href: window.location.href || "",
      origin: window.location.origin || "",
      pathname: window.location.pathname || "",
      referrer: document.referrer || "",
    },
    hardwareConcurrency: nav.hardwareConcurrency || 0,
    deviceMemory: nav.deviceMemory || 0,
    maxTouchPoints: nav.maxTouchPoints || 0,
    cookieEnabled: !!nav.cookieEnabled,
    webdriver: !!nav.webdriver,
    doNotTrack: nav.doNotTrack || "",
    online: !!nav.onLine,
    connection: conn
      ? {
          effectiveType: conn.effectiveType || "",
          downlink: conn.downlink || 0,
          rtt: conn.rtt || 0,
          saveData: !!conn.saveData,
        }
      : null,
  };
};

const buildStableFingerprintSource = (meta) => {
  const source = {
    userAgent: meta.userAgent || "",
    platform: meta.platform || "",
    vendor: meta.vendor || "",
    language: meta.language || "",
    timezone: meta.timezone || "",
    screen: meta.screen || {},
    hardwareConcurrency: meta.hardwareConcurrency || 0,
    deviceMemory: meta.deviceMemory || 0,
    maxTouchPoints: meta.maxTouchPoints || 0,
  };
  return JSON.stringify(source);
};

const hashFingerprint = async (fingerprintSource) => {
  if (!import.meta.client) return "";
  const encoded = new TextEncoder().encode(String(fingerprintSource || ""));
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  const bytes = new Uint8Array(digest);
  return toBase64Url(bytes);
};

const {
  data: response,
  pending,
  error,
} = useFetch(`/api/public/event/${slug}`, {
  key: `public-event-${slug}`,
  retry: 0,
  timeout: 7000,
});
const event = computed(() => response.value?.event);
const availableQuota = computed(() => response.value?.availableQuota);

useHead(() => ({
  title: event.value
    ? `Pendaftaran ${event.value.name}`
    : "Memuat Pendaftaran...",
  meta: [
    {
      name: "robots",
      content:
        "noindex, nofollow, noarchive, nosnippet, noimageindex, noai, noimageai",
    },
    {
      name: "googlebot",
      content: "noindex, nofollow, noarchive, nosnippet, noimageindex",
    },
    {
      name: "bingbot",
      content: "noindex, nofollow, noarchive, nosnippet, noimageindex",
    },
  ],
}));

const parseList = (value) => {
  return String(value || "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const mapLegacyQuestionType = (legacyType) => {
  const mapping = {
    text: "short_answer",
    textarea: "paragraph",
    select: "dropdown",
    radio: "multiple_choice",
  };
  return mapping[legacyType] || "short_answer";
};

const formatPrice = (value) => {
  if (!value) return "";
  const num = parseInt(value);
  if (isNaN(num)) return value;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num);
};

const normalizeItem = (item, index) => {
  if (!item || typeof item !== "object") return null;

  if (item.itemType) {
    if (item.itemType === "question") {
      return {
        id: item.id || `q_${index}`,
        itemType: "question",
        label: String(item.label || ""),
        description: String(item.description || ""),
        questionType: String(item.questionType || "short_answer"),
        required: item.required !== false,
        options: Array.isArray(item.options)
          ? item.options
          : parseList(item.optionsText),
        scaleMin: Number.isFinite(Number(item.scaleMin))
          ? Number(item.scaleMin)
          : 1,
        scaleMax: Number.isFinite(Number(item.scaleMax))
          ? Number(item.scaleMax)
          : 5,
        scaleMinLabel: String(item.scaleMinLabel || ""),
        scaleMaxLabel: String(item.scaleMaxLabel || ""),
        ratingMax: Number.isFinite(Number(item.ratingMax))
          ? Number(item.ratingMax)
          : 5,
        gridRows: Array.isArray(item.gridRows)
          ? item.gridRows
          : parseList(item.gridRowsText),
        gridCols: Array.isArray(item.gridCols)
          ? item.gridCols
          : parseList(item.gridColsText),
        enableMulti: !!item.enableMulti,
      };
    }

    if (["heading", "section", "image", "video"].includes(item.itemType)) {
      return {
        id: item.id || `c_${index}`,
        itemType: item.itemType,
        title: String(item.title || ""),
        description: String(item.description || ""),
        imageUrl: String(item.imageUrl || ""),
        videoUrl: String(item.videoUrl || ""),
      };
    }
  }

  return {
    id: item.id || `legacy_${index}`,
    itemType: "question",
    label: String(item.label || ""),
    description: "",
    questionType: mapLegacyQuestionType(String(item.type || "text")),
    required: item.required !== false,
    options: Array.isArray(item.options)
      ? item.options
      : parseList(item.options),
    scaleMin: 1,
    scaleMax: 5,
    scaleMinLabel: "",
    scaleMaxLabel: "",
    ratingMax: 5,
    gridRows: [],
    gridCols: [],
    enableMulti: !!item.enableMulti,
  };
};

const parsedSchema = computed(() => {
  if (!event.value?.formSchema) return [];
  try {
    const parsed = JSON.parse(event.value.formSchema);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
});

const schemaItems = computed(() => {
  return parsedSchema.value
    .filter((item) => item?.itemType !== "form_meta")
    .map((item, index) => normalizeItem(item, index))
    .filter(Boolean);
});

const formMeta = computed(() => {
  return (
    parsedSchema.value.find((item) => item?.itemType === "form_meta") || {}
  );
});

const eventDate = computed(() => formMeta.value?.eventDate || "");
const eventEndDate = computed(() => formMeta.value?.eventEndDate || "");
const eventTime = computed(() => formMeta.value?.eventTime || "");

const formattedEventDateTime = computed(() => {
  if (!eventDate.value) return "";
  try {
    const start = new Date(`${eventDate.value}T00:00:00`);
    const dateOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    };

    let result = start.toLocaleDateString("id-ID", dateOptions);

    if (eventEndDate.value && eventEndDate.value !== eventDate.value) {
      const end = new Date(`${eventEndDate.value}T00:00:00`);
      result += ` - ${end.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })}`;
    }

    if (eventTime.value) {
      result += ` | ${eventTime.value} WIB`;
    }

    return result;
  } catch (e) {
    return eventDate.value;
  }
});

const formatDescription = (text) => {
  if (!text) return "";

  // Escape HTML to prevent XSS
  const escapeHtml = (unsafe) => {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const escapedText = escapeHtml(text);

  // Regex to find URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  return escapedText.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;">${url}</a>`;
  });
};

const eventLocation = computed(() => formMeta.value?.eventLocation || "");
const eventNominal = computed(() => formMeta.value?.nominal || "");
const isPaymentEnabled = computed(() => !!formMeta.value?.paymentEnabled);

const paymentSettings = computed(() => {
  const methods = Array.isArray(formMeta.value?.paymentSettings)
    ? formMeta.value.paymentSettings
    : [];
  return methods
    .map((method, index) => ({
      id: String(method?.id || `pay_${index}`),
      type: String(method?.type || "bank_transfer"),
      label: String(method?.label || "").trim(),
      accountName: String(method?.accountName || "").trim(),
      accountNumber: String(method?.accountNumber || "").trim(),
      qrisImageUrl: String(method?.qrisImageUrl || "").trim(),
      qrisString: String(method?.qrisString || "").trim(),
      note: String(method?.note || "").trim(),
    }))
    .filter((method) => {
      if (!method.label) return false;
      if (method.type === "qris")
        return !!method.qrisImageUrl || !!method.qrisString;
      return !!method.accountName && !!method.accountNumber;
    });
});

const paymentTypeLabel = (type) => {
  const map = {
    bank_transfer: "Bank Transfer",
    qris: "QRIS",
    ewallet: "E-Wallet",
    other: "Lainnya",
  };
  return map[type] || "Metode Pembayaran";
};

const headerImageUrl = computed(() => {
  return String(formMeta.value?.headerImageUrl || "").trim();
});

const textureClass = computed(() => {
  if (String(formMeta.value?.backgroundMode || "") !== "texture") return "";
  return `texture-${formMeta.value?.backgroundTexture || "dots"}`;
});

const registrationBackgroundStyle = computed(() => {
  const mode = String(formMeta.value?.backgroundMode || "color");
  const baseColor = String(formMeta.value?.backgroundColor || "#0a1222");
  const imageUrl = String(formMeta.value?.backgroundImageUrl || "").trim();

  if (mode === "image" && imageUrl) {
    return {
      backgroundColor: baseColor,
      backgroundImage: `linear-gradient(rgba(5, 10, 20, 0.48), rgba(5, 10, 20, 0.58)), url(${imageUrl})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundAttachment: "fixed",
    };
  }

  return {
    backgroundColor: baseColor,
  };
});

const registrationDeadlineEnabled = computed(() => {
  return !!formMeta.value?.registrationDeadlineEnabled;
});

const registrationDeadlineAt = computed(() => {
  return String(formMeta.value?.registrationDeadlineAt || "").trim();
});

const allowDuplicateDevice = computed(() => {
  return formMeta.value?.allowDuplicateDevice !== false;
});

const deviceGatePending = computed(() => {
  if (!event.value?.id) return false;
  if (isSuccess.value) return false;
  return allowDuplicateDevice.value === false && !deviceStatusChecked.value;
});

const registrationDeadlineLabel = computed(() => {
  const raw = registrationDeadlineAt.value;
  if (!raw) return "-";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleString("id-ID");
});

const isDeadlinePassed = computed(() => {
  if (!registrationDeadlineEnabled.value) return false;
  if (!registrationDeadlineAt.value) return false;
  const deadline = new Date(registrationDeadlineAt.value);
  if (Number.isNaN(deadline.getTime())) return false;
  return Date.now() > deadline.getTime();
});

const isEventPassed = computed(() => {
  if (!eventDate.value) return false;

  const targetDateStr = eventEndDate.value || eventDate.value;
  let eventTimestamp;
  if (eventTime.value) {
    // Check based on specific time if provided
    eventTimestamp = new Date(`${targetDateStr}T${eventTime.value}`).getTime();
  } else {
    // If only date, consider it passed after the end of the day (23:59:59)
    eventTimestamp = new Date(`${targetDateStr}T23:59:59`).getTime();
  }

  if (Number.isNaN(eventTimestamp)) return false;
  return Date.now() > eventTimestamp;
});

const questionItems = computed(() =>
  schemaItems.value.filter((item) => item.itemType === "question"),
);

const CACHE_KEY = computed(() => `form_cache_${slug}`);

const form = ref({
  registrantName: "",
  registrantEmail: "",
});
const answers = ref({});
const fileAnswers = ref({});
const isSubmitting = ref(false);
const selectedProofFile = ref(null);
const isSuccess = ref(false);
const proofFileCache = ref(null);
const deviceMeta = ref(null);
const deviceStatusChecked = ref(false);

const allowMultiTicket = computed(() => !!formMeta.value?.allowMultiTicket);
const maxTicketsPerOrder = computed(() =>
  Number(formMeta.value?.maxTicketsPerOrder ?? 5),
);

const ticketQuantity = ref(1);
const additionalNames = ref([]);
const isMultiTicketMode = ref(false);

const totalAmount = computed(() => {
  const nominal = Number(eventNominal.value || 0);
  const qty = Number(ticketQuantity.value || 1);
  return nominal * qty;
});

const dynamicQrisUrls = ref({});

const calcCRC16 = (data) => {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, "0");
};

const generateDynamicQRIS = (qrisStatic, amount) => {
  if (!qrisStatic || !amount) return qrisStatic;

  try {
    const tags = {};
    let i = 0;

    // Step 1: Parse top-level TLV
    // Standard QRIS always ends with Tag 63 (CRC)
    while (i < qrisStatic.length) {
      const tag = qrisStatic.slice(i, i + 2);
      if (!tag || tag === "63") break;

      const lengthStr = qrisStatic.slice(i + 2, i + 4);
      if (!lengthStr) break;

      const length = parseInt(lengthStr, 10);
      if (isNaN(length)) break;

      const value = qrisStatic.slice(i + 4, i + 4 + length);
      tags[tag] = value;
      i += 4 + length;
    }

    // Step 2: Set Dynamic Mode (Tag 01)
    // 11 = Static, 12 = Dynamic
    tags["01"] = "12";

    // Step 3: Set Transaction Amount (Tag 54)
    // Bank Indonesia standard: Integer for IDR is preferred
    tags["54"] = String(Math.round(amount));

    // Step 4: Ensure Currency Code is IDR (Tag 53 = 360)
    // Most static QRIS already have this, but let's ensure it's there
    if (!tags["53"]) tags["53"] = "360";

    // Step 5: Rebuild the string in numerical order
    let result = "";
    const sortedKeys = Object.keys(tags).sort();
    for (const key of sortedKeys) {
      const val = tags[key];
      result += key + String(val.length).padStart(2, "0") + val;
    }

    // Step 6: Finalize with CRC (Tag 63)
    result += "6304";
    const crc = calcCRC16(result);
    return result + crc;
  } catch (err) {
    console.error("QRIS Compliance Parser Error:", err);
    return qrisStatic; // Fallback to static on error
  }
};

const updateDynamicQrs = async () => {
  if (!import.meta.client) return;
  const amount = totalAmount.value;
  if (!amount) return;

  for (const method of paymentSettings.value) {
    if (method.type === "qris" && method.qrisString) {
      const dynamicString = generateDynamicQRIS(method.qrisString, amount);
      try {
        const url = await QRCode.toDataURL(dynamicString, {
          margin: 1,
          width: 600,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        });
        dynamicQrisUrls.value[method.id] = url;
      } catch (err) {
        console.error("Failed to generate dynamic QRIS:", err);
      }
    }
  }
};

watch([totalAmount, paymentSettings], updateDynamicQrs, { immediate: true });

watch(isMultiTicketMode, (val) => {
  if (val) {
    if (ticketQuantity.value < 2) {
      ticketQuantity.value = 2;
    }
  } else {
    ticketQuantity.value = 1;
  }
});

watch(ticketQuantity, (newVal) => {
  const diff = newVal - 1 - additionalNames.value.length;
  if (diff > 0) {
    for (let i = 0; i < diff; i++) {
      additionalNames.value.push("");
    }
  } else if (diff < 0) {
    additionalNames.value.splice(newVal - 1);
  }
});
const proofInputRef = ref(null);

const PROOF_CACHE_KEY = computed(() => `proof_cache_${slug}`);

watch(
  [form, answers],
  ([newForm, newAnswers]) => {
    if (!process.client) return;
    localStorage.setItem(
      CACHE_KEY.value,
      JSON.stringify({ form: newForm, answers: newAnswers }),
    );
  },
  { deep: true },
);

watch(proofFileCache, (val) => {
  if (!process.client) return;
  if (val) {
    localStorage.setItem(PROOF_CACHE_KEY.value, JSON.stringify(val));
  } else {
    localStorage.removeItem(PROOF_CACHE_KEY.value);
  }
});

onMounted(() => {
  if (process.client) {
    const cached = localStorage.getItem(CACHE_KEY.value);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.form) {
          form.value.registrantName = parsed.form.registrantName || "";
          form.value.registrantEmail = parsed.form.registrantEmail || "";
        }
        if (parsed.answers) {
          answers.value = { ...answers.value, ...parsed.answers };
        }
      } catch (e) {
        console.error("Cache parsing error", e);
      }
    }

    const proofCached = localStorage.getItem(PROOF_CACHE_KEY.value);
    if (proofCached) {
      try {
        const parsed = JSON.parse(proofCached);
        if (parsed?.dataUrl && parsed?.name) {
          proofFileCache.value = parsed;
          const arr = parsed.dataUrl.split(",");
          const mime = arr[0].match(/:(.*?);/)?.[1] || parsed.type;
          const bstr = atob(arr[1]);
          const u8arr = new Uint8Array(bstr.length);
          for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
          selectedProofFile.value = new File([u8arr], parsed.name, {
            type: mime,
          });
        }
      } catch (e) {
        console.error("Proof cache error", e);
      }
    }
  }

  loadOrCreateDeviceMeta();
});

const clearCache = () => {
  if (process.client) {
    localStorage.removeItem(CACHE_KEY.value);
    localStorage.removeItem(PROOF_CACHE_KEY.value);
  }
};

const resetDraftState = () => {
  form.value = {
    registrantName: "",
    registrantEmail: "",
  };
  answers.value = {};
  fileAnswers.value = {};
  selectedProofFile.value = null;
  proofFileCache.value = null;

  if (proofInputRef.value) {
    proofInputRef.value.value = "";
  }
};

const clearAllRegistrationState = () => {
  clearCache();
  resetDraftState();
};

const loadOrCreateDeviceMeta = async () => {
  if (!import.meta.client) return;

  try {
    const cachedRaw = localStorage.getItem(DEVICE_CACHE_KEY);
    if (cachedRaw) {
      const cached = JSON.parse(cachedRaw);
      if (cached?.hash) {
        deviceMeta.value = cached;
        return;
      }
    }
  } catch {
    // ignore cache parsing errors
  }

  const rawMeta = buildRawDeviceMeta();
  const fingerprintSource = buildStableFingerprintSource(rawMeta);
  const hash = await hashFingerprint(fingerprintSource);

  const resolvedMeta = {
    ...rawMeta,
    hash,
    generatedAt: new Date().toISOString(),
  };

  deviceMeta.value = resolvedMeta;

  try {
    localStorage.setItem(DEVICE_CACHE_KEY, JSON.stringify(resolvedMeta));
  } catch {
    // ignore storage limits
  }
};

const checkDeviceDuplicateStatus = async () => {
  if (!import.meta.client) return;
  if (!slug) return;
  if (!event.value?.id) return;
  if (allowDuplicateDevice.value) return;
  if (!deviceMeta.value?.hash) return;
  if (deviceStatusChecked.value) return;

  const normalizedHash = String(deviceMeta.value.hash || "").trim();
  try {
    const cachedRaw = localStorage.getItem(DEVICE_STATUS_CACHE_KEY);
    if (cachedRaw) {
      const cached = JSON.parse(cachedRaw);
      const isFresh =
        cached &&
        cached.deviceHash === normalizedHash &&
        Number(cached.expiresAt || 0) > Date.now();
      if (isFresh) {
        if (cached.blocked) {
          isSuccess.value = true;
          clearAllRegistrationState();
        }
        deviceStatusChecked.value = true;
        return;
      }
    }
  } catch {
    // ignore cache parsing errors
  }

  try {
    const res = await $fetch(`/api/public/event/${slug}/device-status`, {
      method: "POST",
      body: {
        deviceHash: normalizedHash,
      },
    });

    try {
      localStorage.setItem(
        DEVICE_STATUS_CACHE_KEY,
        JSON.stringify({
          deviceHash: normalizedHash,
          blocked: !!res?.blocked,
          expiresAt: Date.now() + DEVICE_STATUS_CACHE_TTL_MS,
        }),
      );
    } catch {
      // ignore storage limits
    }

    if (res?.success && res?.blocked) {
      isSuccess.value = true;
      clearAllRegistrationState();
    }
  } catch {
    // no-op, keep form accessible if check fails
  } finally {
    deviceStatusChecked.value = true;
  }
};

const removeProofCache = () => {
  proofFileCache.value = null;
  selectedProofFile.value = null;
};

const getAnswerId = (qId, pIdx) => {
  if (isMultiTicketMode.value) {
    const item = schemaItems.value.find((i) => i.id === qId);
    if (item?.enableMulti) {
      return `${qId}_p${pIdx}`;
    }
  }
  return qId;
};

watchEffect(() => {
  for (const question of questionItems.value) {
    const iterations =
      isMultiTicketMode.value && question.enableMulti
        ? ticketQuantity.value
        : 1;

    for (let pIdx = 0; pIdx < iterations; pIdx++) {
      const ansId = getAnswerId(question.id, pIdx);
      if (answers.value[ansId] !== undefined) continue;

      if (question.questionType === "checkboxes") {
        answers.value[ansId] = [];
      } else if (
        question.questionType === "multiple_choice_grid" ||
        question.questionType === "checkbox_grid"
      ) {
        answers.value[ansId] = {};
      } else {
        answers.value[ansId] = "";
      }
    }
  }
});

watch(
  [() => event.value?.id, allowDuplicateDevice, () => deviceMeta.value?.hash],
  async () => {
    deviceStatusChecked.value = false;
    await checkDeviceDuplicateStatus();
  },
  { immediate: true },
);

const handleProofUpload = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    showAlert(
      "Ukuran File Terlalu Besar",
      "Ukuran file maksimal 2MB.",
      "warning",
    );
    e.target.value = "";
    selectedProofFile.value = null;
    return;
  }
  selectedProofFile.value = file;

  const reader = new FileReader();
  reader.onload = (ev) => {
    proofFileCache.value = {
      dataUrl: ev.target.result || "",
      name: file.name,
      type: file.type,
    };
  };
  reader.readAsDataURL(file);
};

const handleDynamicFileUpload = (ansId, e) => {
  const file = e.target.files?.[0];
  if (!file) {
    fileAnswers.value[ansId] = null;
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showAlert(
      "Ukuran File Terlalu Besar",
      "Ukuran file untuk pertanyaan upload maksimal 10MB.",
      "warning",
    );
    e.target.value = "";
    fileAnswers.value[ansId] = null;
    return;
  }
  fileAnswers.value[ansId] = file;
};

const isChecked = (ansId, option) => {
  const value = answers.value[ansId];
  return Array.isArray(value) && value.includes(option);
};

const toggleCheckbox = (ansId, option, checked) => {
  const current = Array.isArray(answers.value[ansId])
    ? [...answers.value[ansId]]
    : [];
  if (checked) {
    if (!current.includes(option)) current.push(option);
  } else {
    const idx = current.indexOf(option);
    if (idx >= 0) current.splice(idx, 1);
  }
  answers.value[ansId] = current;
};

const getGridChoice = (ansId, row) => {
  const matrix = answers.value[ansId] || {};
  return matrix[row] || "";
};

const setGridChoice = (ansId, row, col) => {
  const matrix = { ...(answers.value[ansId] || {}) };
  matrix[row] = col;
  answers.value[ansId] = matrix;
};

const isGridChecked = (ansId, row, col) => {
  const matrix = answers.value[ansId] || {};
  const rowValues = Array.isArray(matrix[row]) ? matrix[row] : [];
  return rowValues.includes(col);
};

const toggleGridCheckbox = (ansId, row, col, checked) => {
  const matrix = { ...(answers.value[ansId] || {}) };
  const rowValues = Array.isArray(matrix[row]) ? [...matrix[row]] : [];
  if (checked) {
    if (!rowValues.includes(col)) rowValues.push(col);
  } else {
    const idx = rowValues.indexOf(col);
    if (idx >= 0) rowValues.splice(idx, 1);
  }
  matrix[row] = rowValues;
  answers.value[ansId] = matrix;
};

const scaleRange = (min, max) => {
  const start = Number(min || 1);
  const end = Number(max || 5);
  const range = [];
  for (let i = start; i <= end; i += 1) range.push(i);
  return range;
};

const ratingRange = (max) => {
  const end = Math.max(3, Math.min(10, Number(max || 5)));
  const range = [];
  for (let i = 1; i <= end; i += 1) range.push(i);
  return range;
};

const copyToClipboard = async (text) => {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    showToast("Berhasil Disalin");
  } catch (err) {
    // fallback for older browsers or insecure contexts
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      showToast("Berhasil Disalin");
    } catch (e) {
      showToast("Gagal Menyalin", "error");
    }
    document.body.removeChild(textArea);
  }
};

const handleCloseTab = () => {
  if (process.client) {
    window.close();
    // Fallback if browser blocks window.close()
    setTimeout(() => {
      window.location.href = "/";
    }, 200);
  }
};

const toEmbedVideo = (url) => {
  const source = String(url || "").trim();
  if (!source) return "";
  try {
    const parsed = new URL(source);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }
    if (host === "youtu.be") {
      const id = parsed.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }
    if (host === "vimeo.com") {
      const id = parsed.pathname.replace("/", "");
      return id ? `https://player.vimeo.com/video/${id}` : "";
    }
  } catch {
    return "";
  }
  return "";
};

const validateRequired = () => {
  for (const question of questionItems.value) {
    if (!question.required) continue;

    const iterations =
      isMultiTicketMode.value && question.enableMulti
        ? ticketQuantity.value
        : 1;

    for (let pIdx = 0; pIdx < iterations; pIdx++) {
      const ansId = getAnswerId(question.id, pIdx);
      const value = answers.value[ansId];
      const participantLabel = iterations > 1 ? ` (Peserta ${pIdx + 1})` : "";

      if (
        [
          "short_answer",
          "paragraph",
          "multiple_choice",
          "dropdown",
          "date",
          "time",
          "linear_scale",
          "rating",
        ].includes(question.questionType)
      ) {
        if (
          value === undefined ||
          value === null ||
          String(value).trim() === ""
        ) {
          return (question.label || "Pertanyaan wajib") + participantLabel;
        }
      } else if (question.questionType === "checkboxes") {
        if (!Array.isArray(value) || value.length === 0) {
          return (question.label || "Pertanyaan wajib") + participantLabel;
        }
      } else if (question.questionType === "file_upload") {
        if (!fileAnswers.value[ansId]) {
          return (
            (question.label || "Pertanyaan upload wajib") + participantLabel
          );
        }
      } else if (question.questionType === "multiple_choice_grid") {
        const matrix = value || {};
        const rows = question.gridRows || [];
        const allAnswered = rows.every(
          (row) => matrix[row] && String(matrix[row]).trim() !== "",
        );
        if (!allAnswered) {
          return (question.label || "Grid wajib diisi") + participantLabel;
        }
      } else if (question.questionType === "checkbox_grid") {
        const matrix = value || {};
        const rows = question.gridRows || [];
        const allAnswered = rows.every(
          (row) => Array.isArray(matrix[row]) && matrix[row].length > 0,
        );
        if (!allAnswered) {
          return (question.label || "Grid wajib diisi") + participantLabel;
        }
      }
    }
  }

  if (event.value?.requireProof && !paymentSettings.value.length) {
    return "Konfigurasi metode pembayaran belum lengkap";
  }

  if (event.value?.requireProof && !selectedProofFile.value) {
    return "Bukti Pembayaran / Transfer";
  }

  if (allowMultiTicket.value) {
    for (let i = 0; i < additionalNames.value.length; i++) {
      if (!additionalNames.value[i]?.trim()) {
        return `Nama Pendaftar ${i + 2}`;
      }
    }
  }

  return "";
};

const submitRegistration = async () => {
  if (isDeadlinePassed.value) {
    await showAlert(
      "Pendaftaran Ditutup",
      `Pendaftaran sudah ditutup pada ${registrationDeadlineLabel.value}.`,
      "warning",
    );
    return;
  }

  const invalidField = validateRequired();
  if (invalidField) {
    await showAlert(
      "Form Belum Lengkap",
      `Field wajib belum lengkap: ${invalidField}`,
      "warning",
    );
    return;
  }

  isSubmitting.value = true;
  if (process.client) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  try {
    const payloadAnswers = { ...answers.value };
    for (const question of questionItems.value) {
      const iterations =
        isMultiTicketMode.value && question.enableMulti
          ? ticketQuantity.value
          : 1;

      for (let pIdx = 0; pIdx < iterations; pIdx++) {
        const ansId = getAnswerId(question.id, pIdx);
        if (question.questionType === "file_upload") {
          payloadAnswers[ansId] = payloadAnswers[ansId] || null;
        }
      }
    }

    const multipart = new FormData();
    multipart.append("eventId", event.value.id);
    multipart.append("registrantName", form.value.registrantName);
    multipart.append("registrantEmail", form.value.registrantEmail);
    multipart.append("formData", JSON.stringify(payloadAnswers));

    if (allowMultiTicket.value) {
      multipart.append("quantity", String(ticketQuantity.value));
      multipart.append(
        "additionalNames",
        JSON.stringify(additionalNames.value),
      );
    }

    if (deviceMeta.value) {
      multipart.append("deviceMeta", JSON.stringify(deviceMeta.value));
    }

    if (event.value.requireProof && selectedProofFile.value) {
      multipart.append("paymentProof", selectedProofFile.value);
    }

    for (const [questionId, file] of Object.entries(fileAnswers.value)) {
      if (file) {
        multipart.append(`dynamicFile:${questionId}`, file);
      }
    }

    const [res] = await Promise.all([
      $fetch("/api/ticket/register", {
        method: "POST",
        body: multipart,
      }),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);

    if (res.success) {
      isSuccess.value = true;
      clearAllRegistrationState();
      window.scrollTo(0, 0);
    }
  } catch (err) {
    const statusMessage = err?.data?.statusMessage || "Pendaftaran gagal";
    if (/perangkat ini sudah pernah mendaftar/i.test(statusMessage)) {
      isSuccess.value = true;
      clearAllRegistrationState();
      return;
    }
    await showAlert("Pendaftaran Gagal", statusMessage, "error");
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped lang="scss">
.registration-page {
  min-height: 100vh;
  padding: 0rem 1rem 3rem 1rem;
  background-repeat: repeat;
}

.registration-page.texture-dots {
  background-image: radial-gradient(
    rgba(255, 255, 255, 0.08) 1px,
    transparent 1px
  );
  background-size: 16px 16px;
}

.registration-page.texture-grid {
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px);
  background-size: 28px 28px;
}

.registration-page.texture-diagonal {
  background-image: repeating-linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.08) 0 2px,
    transparent 2px 14px
  );
}

.registration-page.texture-zigzag {
  background-image:
    linear-gradient(135deg, rgba(255, 255, 255, 0.08) 25%, transparent 25%),
    linear-gradient(225deg, rgba(255, 255, 255, 0.08) 25%, transparent 25%),
    linear-gradient(45deg, rgba(255, 255, 255, 0.08) 25%, transparent 25%),
    linear-gradient(315deg, rgba(255, 255, 255, 0.08) 25%, transparent 25%);
  background-size: 40px 40px;
  background-position:
    20px 0,
    20px 0,
    0 0,
    0 0;
}

.registration-page.texture-crosshatch {
  background:
    linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.08) 25%,
      transparent 25%,
      transparent 75%,
      rgba(255, 255, 255, 0.08) 75%,
      rgba(255, 255, 255, 0.08)
    ),
    linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.08) 25%,
      transparent 25%,
      transparent 75%,
      rgba(255, 255, 255, 0.08) 75%,
      rgba(255, 255, 255, 0.08)
    );
  background-size: 30px 30px;
  background-position:
    0 0,
    15px 15px;
}

.registration-page.texture-triangles {
  background-image:
    linear-gradient(45deg, rgba(255, 255, 255, 0.08) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(255, 255, 255, 0.08) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(255, 255, 255, 0.08) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(255, 255, 255, 0.08) 75%);
  background-size: 40px 40px;
  background-position:
    0 0,
    0 20px,
    20px -20px,
    -20px 0px;
}

.registration-page.texture-cubes {
  background-color: transparent;
  background-image:
    linear-gradient(
      30deg,
      rgba(255, 255, 255, 0.08) 12%,
      transparent 12.5%,
      transparent 87%,
      rgba(255, 255, 255, 0.08) 87.5%,
      rgba(255, 255, 255, 0.08)
    ),
    linear-gradient(
      150deg,
      rgba(255, 255, 255, 0.08) 12%,
      transparent 12.5%,
      transparent 87%,
      rgba(255, 255, 255, 0.08) 87.5%,
      rgba(255, 255, 255, 0.08)
    ),
    linear-gradient(
      30deg,
      rgba(255, 255, 255, 0.08) 12%,
      transparent 12.5%,
      transparent 87%,
      rgba(255, 255, 255, 0.08) 87.5%,
      rgba(255, 255, 255, 0.08)
    ),
    linear-gradient(
      150deg,
      rgba(255, 255, 255, 0.08) 12%,
      transparent 12.5%,
      transparent 87%,
      rgba(255, 255, 255, 0.08) 87.5%,
      rgba(255, 255, 255, 0.08)
    ),
    linear-gradient(
      60deg,
      rgba(255, 255, 255, 0.1) 25%,
      transparent 25.5%,
      transparent 75%,
      rgba(255, 255, 255, 0.1) 75%,
      rgba(255, 255, 255, 0.1)
    ),
    linear-gradient(
      60deg,
      rgba(255, 255, 255, 0.1) 25%,
      transparent 25.5%,
      transparent 75%,
      rgba(255, 255, 255, 0.1) 75%,
      rgba(255, 255, 255, 0.1)
    );
  background-size: 40px 70px;
  background-position:
    0 0,
    0 0,
    20px 35px,
    20px 35px,
    0 0,
    20px 35px;
}

.registration-page.texture-circles {
  background-image:
    radial-gradient(circle, rgba(255, 255, 255, 0.08) 20%, transparent 20%),
    radial-gradient(circle, rgba(255, 255, 255, 0.08) 20%, transparent 20%);
  background-size: 40px 40px;
  background-position:
    0 0,
    20px 20px;
}

.registration-page.texture-waves {
  background-image:
    radial-gradient(
      circle at 100% 50%,
      transparent 20%,
      rgba(255, 255, 255, 0.06) 21%,
      rgba(255, 255, 255, 0.06) 34%,
      transparent 35%,
      transparent
    ),
    radial-gradient(
      circle at 0% 50%,
      transparent 20%,
      rgba(255, 255, 255, 0.06) 21%,
      rgba(255, 255, 255, 0.06) 34%,
      transparent 35%,
      transparent
    );
  background-size: 40px 40px;
}

.registration-shell {
  padding: 1rem;
}

.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition:
    opacity 0.2s ease,
    transform 0.1s ease;
}

.submit-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}

.btn-spinner-wrap {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-spinner {
  width: 18px;
  height: 18px;
  animation: spin 0.8s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.proof-preview {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(34, 197, 94, 0.08);
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: 10px;
  padding: 0.75rem 1rem;
}

.proof-thumb {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.proof-info {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  flex: 1;
  min-width: 0;
}

.proof-name {
  font-size: 0.85rem;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.proof-remove {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border-radius: 6px;
  padding: 0.2rem 0.6rem;
  font-size: 0.8rem;
  cursor: pointer;
  width: fit-content;
  transition: background 0.2s;
}

.proof-remove:hover {
  background: rgba(239, 68, 68, 0.2);
}

.gradient-text {
  font-size: clamp(1.6rem, 5vw, 2.5rem);
  font-weight: 800;
  background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.2;
  margin: 0.6rem 0;
  word-wrap: break-word;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.max-w-3xl {
  max-width: 860px;
}
.mx-auto {
  margin-left: auto;
  margin-right: auto;
}
.text-center {
  text-align: center;
}
.py-8 {
  padding: 2rem 0;
}
.pt-8 {
  padding-top: 2rem;
}
.mb-8 {
  margin-bottom: 2rem;
}
.mb-2 {
  margin-bottom: 0.5rem;
}
.mt-2 {
  margin-top: 0.5rem;
}
.mt-4 {
  margin-top: 1rem;
}
.mt-8 {
  margin-top: 2rem;
}
.text-muted {
  color: var(--text-muted);
}
.text-red {
  color: #ef4444;
}
.text-sm {
  font-size: 0.875rem;
}
.w-full {
  width: 100%;
}

.badge {
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  display: inline-block;
}

.badge-gray {
  background: rgba(148, 163, 184, 0.2);
  color: #94a3b8;
  border: 1px solid rgba(148, 163, 184, 0.3);
}

.alert {
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  font-weight: 500;
}

.alert.error {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.registration-form {
  display: flex;
  flex-direction: column;
  gap: 0.95rem;
}

.form-card {
  border: 1px solid var(--line-soft);
  border-radius: 12px;
  background: rgba(8, 17, 33, 0.45);
  padding: 1.25rem;
}

.section-label {
  display: block;
  font-size: 0.95rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.quantity-section {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--line-soft);
  border-radius: 12px;
  padding: 1.25rem;
  text-align: center;
}

.quantity-selector {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  background: rgba(0, 0, 0, 0.2);
  width: fit-content;
  padding: 0.5rem;
  border-radius: 12px;
  border: 1px solid var(--line-soft);
  margin: 0 auto;
}

.qty-btn {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.qty-btn:hover:not(:disabled) {
  filter: brightness(1.2);
  transform: translateY(-1px);
}

.qty-btn:disabled {
  background: #334155;
  cursor: not-allowed;
  opacity: 0.5;
}

.qty-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 60px;
}

.qty-num {
  font-size: 1.5rem;
  font-weight: 800;
  color: #fff;
  line-height: 1;
}

.qty-text {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  font-weight: 600;
}

.qty-hint {
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.participants-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.participant-card {
  position: relative;
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid var(--line-soft);
  border-radius: 12px;
  padding: 1.5rem 1.25rem 1.25rem;
  transition: all 0.2s;
}

.participant-card.primary {
  border-left: 4px solid var(--primary);
}

.participant-card:hover {
  border-color: rgba(255, 255, 255, 0.2);
  background: rgba(15, 23, 42, 0.6);
}

.participant-badge {
  position: absolute;
  top: -10px;
  left: 15px;
  background: var(--line-soft);
  padding: 0.15rem 0.6rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #94a3b8;
  border: 1px solid var(--line-soft);
}

.participant-card.primary .participant-badge {
  background: var(--primary);
  color: #fff;
}

.mb-6 {
  margin-bottom: 1.5rem;
}
.mb-0 {
  margin-bottom: 0;
}
.mb-4 {
  margin-bottom: 1rem;
}

.participant-badge-inline {
  display: inline-block;
  background: var(--primary);
  color: #fff;
  font-size: 0.65rem;
  font-weight: 800;
  padding: 0.1rem 0.5rem;
  border-radius: 4px;
  text-transform: uppercase;
  margin-left: 0.5rem;
  vertical-align: middle;
}

.detail-value-wrap {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn-copy {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(59, 130, 246, 0.2);
    border-color: rgba(59, 130, 246, 0.4);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    opacity: 0.8;
  }
}

.mode-toggle-section {
  cursor: pointer;
}

.toggle-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--line-soft);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.2);
}

.toggle-card.active {
  background: rgba(59, 130, 246, 0.08);
  border-color: var(--primary);
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.1);
}

.hidden-check {
  display: none;
}

.toggle-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.toggle-icon {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  transition: all 0.2s;
}

.toggle-card.active .toggle-icon {
  background: var(--primary);
  color: #fff;
}

.toggle-text {
  display: flex;
  flex-direction: column;
}

.toggle-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #fff;
}

.toggle-desc {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.toggle-status {
  width: 40px;
  height: 22px;
  background: #334155;
  border-radius: 99px;
  position: relative;
  transition: all 0.3s;
}

.status-indicator {
  width: 16px;
  height: 16px;
  background: #fff;
  border-radius: 50%;
  position: absolute;
  top: 3px;
  left: 3px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toggle-card.active .toggle-status {
  background: var(--primary);
}

.toggle-card.active .status-indicator {
  left: calc(100% - 19px);
}

.static-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.8rem;
}

.dynamic-wrap {
  margin-top: 0.95rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.82rem;
}

.field-desc {
  margin-top: -0.1rem;
  color: var(--text-muted);
  font-size: 0.8rem;
}

label {
  font-size: 0.84rem;
  font-weight: 600;
  color: #d8e4f4;
}

.content-block {
  border: 1px solid var(--line-soft);
  border-radius: 10px;
  background: rgba(8, 16, 30, 0.5);
  padding: 0.75rem;
  margin-bottom: 0.78rem;
}

.heading-block h3,
.section-block h4 {
  font-size: 1rem;
}

.section-block hr {
  border: none;
  border-top: 1px solid var(--line-soft);
  margin-bottom: 0.6rem;
}

.content-image {
  width: 100%;
  max-height: 320px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.event-header-image {
  width: 100%;
  max-height: 220px;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid var(--line-soft);
  margin-bottom: 0.9rem;
}

.video-embed {
  width: 100%;
  min-height: 280px;
  border: 1px solid var(--line-soft);
  border-radius: 8px;
}

.video-link {
  color: #7ddcff;
  text-decoration: none;
}

.video-link:hover {
  text-decoration: underline;
}

.media-empty {
  color: var(--text-muted);
  font-size: 0.84rem;
}

.border-dashed {
  border: 1px dashed var(--glass-border);
}
.rounded {
  border-radius: 8px;
}
.p-4 {
  padding: 1rem;
}

.proof-box {
  margin-top: 0.2rem;
}

.payment-box {
  border: 1px solid var(--line-soft);
  border-radius: 10px;
  background: rgba(8, 16, 30, 0.5);
  padding: 0.9rem;
}

.payment-box h4 {
  font-size: 0.95rem;
}

.payment-methods {
  margin-top: 0.55rem;
  display: grid;
  gap: 0.6rem;
}

.payment-method {
  border: 1px dashed var(--line-soft);
  border-radius: 10px;
  padding: 0.68rem;
}

.payment-method-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.6rem;
}

.payment-type {
  border: 1px solid var(--line-soft);
  border-radius: 999px;
  padding: 0.12rem 0.45rem;
  font-size: 0.72rem;
  color: var(--text-muted);
}

.payment-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.6rem 0;
}

.detail-row {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.detail-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  color: var(--text-muted);
  letter-spacing: 0.04em;
}

.detail-value {
  font-size: 1.05rem;
  color: #fff;
  font-weight: 600;
}

.detail-value.highlight {
  font-size: 1.35rem;
  color: #fbbf24; /* Amber/Gold color for the account number */
  font-family: "Courier New", Courier, monospace;
  letter-spacing: 0.02em;
}

/* QRIS Redesign */
.qris-wrapper {
  background: #ffffff;
  border-radius: 12px;
  padding: 0.25rem;
  box-shadow:
    0 10px 25px -5px rgba(0, 0, 0, 0.3),
    0 8px 10px -6px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 260px;
  margin: 0.75rem auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  position: relative;
}

.qris-container {
  display: flex;
  justify-content: center;
  background: #fff;
  padding: 0.25rem;
  border-radius: 6px;
}

.qris-image {
  width: 100%;
  max-width: 220px;
  height: auto;
  display: block;
}

.qris-footer {
  margin-top: 0.5rem;
  text-align: center;
}

.scan-instruction {
  font-size: 0.7rem;
  color: #64748b;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.btn-download-qris {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  width: 100%;
  padding: 0.45rem;
  background: #f1f5f9;
  color: #475569;
  border: none;
  border-radius: 8px;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-download-qris:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.btn-download-qris svg {
  opacity: 0.8;
}

.radio-group {
  display: grid;
  gap: 0.45rem;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  border: 1px solid var(--line-soft);
  border-radius: 10px;
  padding: 0.52rem 0.65rem;
  background: rgba(11, 21, 39, 0.6);
}

.file-wrap {
  display: grid;
  gap: 0.38rem;
}

.file-note {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.scale-wrap {
  border: 1px solid var(--line-soft);
  border-radius: 10px;
  padding: 0.7rem;
}

.scale-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(42px, 1fr));
  gap: 0.4rem;
}

.scale-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.78rem;
}

.scale-labels {
  margin-top: 0.5rem;
  display: flex;
  justify-content: space-between;
  color: var(--text-muted);
  font-size: 0.78rem;
}

.rating-wrap {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(48px, 1fr));
  gap: 0.38rem;
}

.rating-option {
  border: 1px solid var(--line-soft);
  border-radius: 10px;
  padding: 0.42rem 0.2rem;
  text-align: center;
  background: rgba(11, 21, 39, 0.55);
  font-size: 0.8rem;
}

.rating-option span {
  margin-left: 0.22rem;
}

.grid-wrap {
  overflow-x: auto;
  border: 1px solid var(--line-soft);
  border-radius: 10px;
}

.grid-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 560px;
}

.grid-table th,
.grid-table td {
  border-bottom: 1px solid rgba(148, 163, 184, 0.16);
  padding: 0.48rem;
  text-align: center;
  font-size: 0.82rem;
}

.billing-summary {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid var(--line-soft);
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.billing-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.billing-label {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.billing-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: #fff;
}

.billing-divider {
  height: 1px;
  border-top: 1px dashed var(--line-soft);
  margin: 0.25rem 0;
}

.global-nominal-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--line-soft);
  border-radius: 12px;
}

.nominal-label {
  font-size: 0.9rem;
  color: var(--text-muted);
}

.nominal-value {
  font-size: 1.5rem;
  color: #fff;
  font-weight: 800;
}

.billing-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-label {
  font-size: 0.9rem;
  font-weight: 700;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.total-wrap {
  display: flex;
  flex-direction: column;
  align-items: end;
  gap: 0.25rem;
}

.total-amount {
  font-size: 1.5rem;
  font-weight: 800;
  color: #fbbf24;
  text-shadow: 0 0 20px rgba(251, 191, 36, 0.2);
}

.total-badge {
  font-size: 0.65rem;
  background: rgba(251, 191, 36, 0.1);
  color: #fbbf24;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  border: 1px solid rgba(251, 191, 36, 0.2);
  text-transform: uppercase;
  font-weight: 700;
}

.grid-table th:first-child,
.grid-table td:first-child {
  text-align: left;
}

.form-footer {
  margin: 2.5rem auto 1rem;
  max-width: 860px;
  padding-top: 1.8rem;
  border-top: 1px solid rgba(148, 163, 184, 0.12);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
}

.form-footer .brand {
  text-decoration: none;
  display: inline-flex;
}

.form-footer .brand-name {
  font-size: 1.15rem;
  font-weight: 800;
}

.form-footer .landing-logo {
  max-width: 150px;
  max-height: 34px;
  object-fit: contain;
}

.form-footer .copyright {
  color: var(--text-muted);
  font-size: 0.78rem;
  letter-spacing: 0.01em;
}
.global-nominal-card {
  margin: 1rem 0;
  padding: 1.2rem;
  background: linear-gradient(
    135deg,
    rgba(34, 197, 94, 0.15),
    rgba(34, 197, 94, 0.05)
  );
  border: 1px solid rgba(34, 197, 94, 0.35);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.nominal-label {
  font-size: 0.85rem;
  color: #9ee8b2;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.nominal-value {
  font-size: 2rem;
  color: #4ade80;
  letter-spacing: 0.02em;
  font-weight: 900;
  text-shadow: 0 0 15px rgba(74, 222, 128, 0.3);
}

.payment-nominal-box {
  display: none;
}
.header-divider {
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(148, 163, 184, 0.4),
    transparent
  );
  width: 90%;
  margin-left: auto;
  margin-right: auto;
}
.error-container {
  min-height: calc(100vh - 6rem);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.error-card {
  max-width: 480px;
  width: 100%;
  padding: 3rem 2rem;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.error-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  box-shadow: inset 0 0 0 1px rgba(239, 68, 68, 0.2);
}

.error-icon svg {
  width: 36px;
  height: 36px;
}

.error-title {
  font-size: clamp(1.4rem, 4vw, 1.8rem);
  margin-bottom: 0.8rem;
  font-weight: 800;
  color: #fff;
}

.error-desc {
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  max-width: 380px;
}

.error-actions {
  display: flex;
  gap: 1rem;
  width: 100%;
  justify-content: center;
}

.error-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 0.8rem 1.5rem;
  font-size: 0.95rem;
  border-radius: 12px;
}

.event-passed-container {
  padding: 1rem 0;
}

.passed-card {
  padding: 3rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  border-radius: 20px;
}

.passed-icon-wrap {
  width: 72px;
  height: 72px;
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  box-shadow: inset 0 0 0 1px rgba(239, 68, 68, 0.2);
}

.passed-icon-wrap svg {
  width: 32px;
  height: 32px;
}

.passed-title {
  font-size: 1.8rem;
  font-weight: 800;
  margin-bottom: 1rem;
}

.passed-desc {
  color: var(--text-muted);
  line-height: 1.6;
  max-width: 440px;
  margin: 0 auto 2rem;
}

.passed-actions {
  display: flex;
  gap: 1rem;
}

.pre-wrap {
  white-space: pre-wrap;
}

.field-desc {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
  white-space: pre-wrap;
}
</style>
