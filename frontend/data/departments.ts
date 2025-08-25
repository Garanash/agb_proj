export interface Employee {
  name: string
  position: string
  extension: string
  phone: string
  email: string
}

export interface Department {
  name: string
  employees: Employee[]
}

export const departments: Department[] = [
  {
    name: "РУКОВОДИТЕЛИ",
    employees: [
      {
        name: "Горбунов Юрий Васильевич",
        position: "Исполнительный директор",
        extension: "500",
        phone: "",
        email: "yg@almazgeobur.ru"
      },
      {
        name: "Свинарёв Антон Сергеевич",
        position: "Генеральный директор",
        extension: "501",
        phone: "8 (967) 223-20-95",
        email: "as@almazgeobur.ru"
      },
      {
        name: "Кавецкий Сергей Викторович",
        position: "Главный инженер",
        extension: "401",
        phone: "8 (914) 400-22-04",
        email: "sk@almazgeobur.ru"
      },
      {
        name: "Желудков Дмитрий Иванович",
        position: "Заместитель генерального директора по безопасности",
        extension: "411",
        phone: "8-965-115-25-81",
        email: "d.zheludkov@almazgeobur.ru"
      }
    ]
  },
  {
    name: "БУХГАЛТЕРИЯ, ФИНАНСЫ",
    employees: [
      {
        name: "Прокопенко Алексей Николаевич",
        position: "Финансовый директор",
        extension: "555",
        phone: "8 (985) 311-13-39",
        email: "a.prokopenko@almazgeobur.ru"
      },
      {
        name: "Белова Татьяна Павловна",
        position: "Главный бухгалтер АГБ",
        extension: "100",
        phone: "8 (915) 220-61-16",
        email: "tb@almazgeobur.ru"
      },
      {
        name: "Нелюбова Елена Александровна",
        position: "Бухгалтер",
        extension: "502",
        phone: "8-903-522-08-80",
        email: "e.neliubova@almazgeobur.ru"
      },
      {
        name: "Рехтина Мария Сергеевна",
        position: "Руководитель группы материального учета",
        extension: "535",
        phone: "8 (903) 209-68-51",
        email: "mr@almazgeobur.ru"
      },
      {
        name: "Быкова Елена Вячеславовна",
        position: "Бухгалтер по расчету з/п",
        extension: "511",
        phone: "8 (916) 912-05-21",
        email: "e.bykova@almazgeobur.ru"
      },
      {
        name: "Маркин Александр Сергеевич",
        position: "Бухгалтер",
        extension: "506",
        phone: "8 (926) 268-44-26",
        email: "amarkin@bsvr-group.ru"
      },
      {
        name: "Вильданова Екатерина Раисовна",
        position: "Бухгалтер",
        extension: "510",
        phone: "8 (996) 453-53-73",
        email: "e.vildanova@almazgeobur.ru"
      }
    ]
  },
  {
    name: "ОТДЕЛ КАДРОВ",
    employees: [
      {
        name: "Ягодина Елена Владимировна",
        position: "Начальник отдела кадров",
        extension: "524",
        phone: "8-903-759-94-07",
        email: "e.yagodina@almazgeobur.ru"
      },
      {
        name: "Федотова Екатерина Вячеславовна",
        position: "Специалист отдела кадров",
        extension: "512",
        phone: "8 (916) 412-19-94",
        email: "ef@almazgeobur.ru"
      },
      {
        name: "Соколова Виктория Владимировна",
        position: "Специалист по учету рабочего времени",
        extension: "538",
        phone: "8-925-822-64-44",
        email: "v.sokolova@almazgeobur.ru"
      },
      {
        name: "Антонова Анна Александровна",
        position: "Специалист по подбору персонала",
        extension: "532",
        phone: "8-985-351-26-90",
        email: "a.antonova@almazgeobur.ru"
      }
    ]
  },
  {
    name: "ОФИС-МЕНЕДЖЕР, ОХРАНА ТРУДА, ПРОГРАММИСТ, ЮРИСТ",
    employees: [
      {
        name: "Муравьева Александра Юрьевна",
        position: "Офис-менеджер",
        extension: "513",
        phone: "8-964-777-79-18",
        email: "a.muravyova@almazgeobur.ru"
      },
      {
        name: "Николаева Ирина Николаевна",
        position: "Ассистент директора",
        extension: "505",
        phone: "8-916-516-63-37",
        email: "i.nikolaeva@almazgeobur.ru"
      },
      {
        name: "Гашимова Юлия Вячеславовна",
        position: "Руководитель юридического отдела",
        extension: "526",
        phone: "8(903)712-55-38",
        email: "yu.gashimova@bsvr-group.ru"
      },
      {
        name: "Данилова Галина Юрьевна",
        position: "Специалист по охране труда",
        extension: "541",
        phone: "8-916-609-47-37",
        email: "g.danilova@almazgeobur.ru"
      }
    ]
  },
  {
    name: "ОТДЕЛ ЗАКУПОК И ПРОДАЖ",
    employees: [
      {
        name: "Богданов Игорь Олегович",
        position: "Заместитель директора по закупкам",
        extension: "529",
        phone: "8-916-610-04-76",
        email: "i.bogdanov@almazgeobur.ru"
      },
      {
        name: "Евсюкова Анастасия Александровна",
        position: "Аналитик",
        extension: "623",
        phone: "8-916-596-36-96",
        email: "a.evsiukova@almazgeobur.ru"
      },
      {
        name: "Федоров Максим Юрьевич",
        position: "Заместитель директора по закупкам",
        extension: "528",
        phone: "8-926-530-10-89",
        email: "m.fedorov@almazgeobur.ru"
      }
    ]
  },
  {
    name: "ТЕХНИЧЕСКИЙ ОТДЕЛ",
    employees: [
      {
        name: "Игнатьев Олег Геннадьевич",
        position: "Заместитель Главного конструктора",
        extension: "",
        phone: "8-960-305-83-10",
        email: "o.ignatev@bsvr-group.ru"
      },
      {
        name: "Борисов Сергей Александрович",
        position: "Инженер-конструктор",
        extension: "",
        phone: "8 (937) 031-91-21",
        email: "s.borisov@almazgeobur.ru"
      },
      {
        name: "Федоренко Владимир Игоревич",
        position: "Конструктор",
        extension: "",
        phone: "8-968-621-76-31",
        email: "v.fedorenko@bsvr-group.ru"
      }
    ]
  },
  {
    name: "ПРОИЗВОДСТВО",
    employees: [
      {
        name: "Мусатов Василий Александрович",
        position: "Заместитель начальника производства",
        extension: "503",
        phone: "8 (916) 900-26-98",
        email: "musatov@bsvr-group.ru"
      },
      {
        name: "Бубнов Вячеслав Юрьевич",
        position: "Начальник производства",
        extension: "",
        phone: "8 (926) 622-52-05",
        email: "bubnov@bsvr-group.ru"
      },
      {
        name: "Попков Владимир Владимирович",
        position: "Первый заместитель начальника производства",
        extension: "",
        phone: "8-977-399-47-38",
        email: "v.popkov@bsvr-group.ru"
      }
    ]
  },
  {
    name: "МАГАДАН",
    employees: [
      {
        name: "Демьянченко Арина Давидовна",
        position: "ВРИО Руководителя обособленного подразделения в г. Магадан",
        extension: "801",
        phone: "8-926-884-47-18",
        email: "a.demianchenko@almazgeobur.ru"
      },
      {
        name: "Юлдашева Дамира Ильдаровна",
        position: "Специалист отдела продаж бурового оборудования",
        extension: "",
        phone: "8-927-609-62-83",
        email: "uldasheva@almazgeobur.ru"
      }
    ]
  },
  {
    name: "СИБИРСКОЕ ОБОСОБЛЕННОЕ ПОДРАЗДЕЛЕНИЕ г. КРАСНОЯРСК",
    employees: [
      {
        name: "Слюсарев Денис Викторович",
        position: "Рук. отд. продаж по Сибирскому федеральному округу",
        extension: "701",
        phone: "8 (983) 293-75-39",
        email: "ds@almazgeobur.ru"
      },
      {
        name: "Сальманов Кирилл Равильевич",
        position: "Сервисный инженер",
        extension: "",
        phone: "8-914-214-49-59",
        email: "k.salmanov@almazgeobur.ru"
      }
    ]
  }
]
