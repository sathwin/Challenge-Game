import { PolicyCategory, PolicyOption } from '../types';

export const policyCategories: PolicyCategory[] = [
  {
    id: 1,
    name: "Access to Education",
    options: [
      {
        id: 1,
        title: "Limited Access",
        description: "Limit access to education for refugees, allowing only a small percentage to enroll in mainstream schools.",
        advantages: "Prioritizing resources on citizens potentially eases the pressure on educational infrastructure.",
        disadvantages: "Excludes a significant portion of refugee children from accessing quality education, hindering their future prospects.",
        cost: 1
      },
      {
        id: 2,
        title: "Separate Schools",
        description: "Establish separate schools or learning centers specifically for refugee education, ensuring access to education.",
        advantages: "Provides dedicated education for refugees, considering their unique needs and challenges.",
        disadvantages: "This may foster segregation and limit interaction and integration opportunities between refugees and citizens.",
        cost: 2
      },
      {
        id: 3,
        title: "Equal Access",
        description: "Provide equal access to education for all, and integrate refugee students into mainstream schools.",
        advantages: "Promotes integration, cultural exchange, and social cohesion among refugees and citizens.",
        disadvantages: "Requires additional resources, teacher training, and support systems to accommodate diverse student populations.",
        cost: 3
      }
    ]
  },
  {
    id: 2,
    name: "Language Instruction",
    options: [
      {
        id: 1,
        title: "Teanish Only",
        description: "Maintain the current policy of teaching only Teanish in schools, excluding other languages, including those spoken by refugees.",
        advantages: "Preserves linguistic unity and simplifies administrative processes.",
        disadvantages: "Hinders effective communication and integration of refugee students, potentially leading to educational disparities.",
        cost: 1
      },
      {
        id: 2,
        title: "Basic Teanish Courses",
        description: "Provide primary Teanish language courses to refugees, enabling them to access essential services.",
        advantages: "Offers a minimum level of language proficiency for basic communication needs.",
        disadvantages: "Limits educational opportunities and restricts academic progress due to inadequate language skills.",
        cost: 2
      },
      {
        id: 3,
        title: "Bilingual Education",
        description: "Implement comprehensive bilingual education programs, offering education in both Teanish and the mother tongue of refugees.",
        advantages: "Facilitates better communication, inclusivity, integration, and preservation of cultural identities.",
        disadvantages: "Requires additional resources and potentially challenges curriculum implementation due to diverse language demands.",
        cost: 3
      }
    ]
  },
  {
    id: 3,
    name: "Teacher Training",
    options: [
      {
        id: 1,
        title: "Minimal Training",
        description: "Provide minimal or no specific training for teachers regarding refugee education.",
        advantages: "Requires fewer resources and minimal changes to existing teacher training programs.",
        disadvantages: "Limits teachers' ability to effectively address the unique needs and challenges of refugee students.",
        cost: 1
      },
      {
        id: 2,
        title: "Basic Training",
        description: "Offer basic training sessions for teachers to familiarize them with the challenges and needs of refugee students.",
        advantages: "Provides teachers with a foundational understanding of refugee education and some strategies to support students.",
        disadvantages: "May not fully equip teachers to address complex challenges or provide comprehensive support for refugee students.",
        cost: 2
      },
      {
        id: 3,
        title: "Comprehensive Training",
        description: "Implement comprehensive and ongoing training programs for teachers, equipping them with the necessary skills to effectively support and educate refugee students.",
        advantages: "Enhances teachers' capacity to address the diverse needs of refugee students and promote their educational success.",
        disadvantages: "Requires substantial investment in training programs and ongoing professional development for teachers.",
        cost: 3
      }
    ]
  },
  {
    id: 4,
    name: "Curriculum Adaptation",
    options: [
      {
        id: 1,
        title: "No Adaptation",
        description: "Maintain the existing national curriculum without modifications.",
        advantages: "Maintains continuity and preserves the integrity of the existing curriculum.",
        disadvantages: "Neglects the inclusion of refugee experiences, histories, and cultural diversity, potentially hindering cultural understanding and integration.",
        cost: 1
      },
      {
        id: 2,
        title: "Supplementary Materials",
        description: "Introduce supplementary materials and resources that acknowledge the experiences and contributions of refugees while still following the mainstream curriculum.",
        advantages: "Provides some recognition of refugee experiences within the existing curriculum, fostering empathy and awareness among students.",
        disadvantages: "May not fully address the specific educational and cultural needs of refugee students or provide comprehensive representation.",
        cost: 2
      },
      {
        id: 3,
        title: "Inclusive Curriculum",
        description: "Adapt the national curriculum to include diverse perspectives, histories, and cultural elements relevant to both citizens and refugees.",
        advantages: "Promotes cultural exchange, mutual understanding, and respect among students from diverse backgrounds.",
        disadvantages: "Requires substantial curriculum redesign and ongoing updates to incorporate diverse perspectives, potentially posing logistical challenges and resistance to change.",
        cost: 3
      }
    ]
  },
  {
    id: 5,
    name: "Psychosocial Support",
    options: [
      {
        id: 1,
        title: "Minimal Support",
        description: "Provide limited or no specific psychosocial support for refugee students.",
        advantages: "Reduces immediate financial and resource burdens associated with providing dedicated psychosocial support.",
        disadvantages: "Negatively impacts the mental health and well-being of refugee students, potentially hindering their educational success.",
        cost: 1
      },
      {
        id: 2,
        title: "Basic Support",
        description: "Establish basic support services such as counseling and peer support programs to address the psychosocial needs of refugee students.",
        advantages: "Provides some level of support and assistance to address the unique psychosocial challenges faced by refugee students.",
        disadvantages: "May require additional resources and trained personnel to effectively implement and maintain support services.",
        cost: 2
      },
      {
        id: 3,
        title: "Comprehensive Support",
        description: "Develop comprehensive and specialized psychosocial support programs, offering tailored assistance to refugee students and their families.",
        advantages: "Prioritizes the mental health and well-being of refugee students, facilitating their successful integration and academic progress.",
        disadvantages: "Requires significant investment in resources, trained professionals, and ongoing support services to ensure their effectiveness and sustainability.",
        cost: 3
      }
    ]
  },
  {
    id: 6,
    name: "Financial Support",
    options: [
      {
        id: 1,
        title: "Minimal Funding",
        description: "Allocate minimal funds to support refugee education.",
        advantages: "Minimizes the financial burden on the government and taxpayers.",
        disadvantages: "Limits the quality and accessibility of educational resources and support for refugee students.",
        cost: 1
      },
      {
        id: 2,
        title: "Moderate Funding",
        description: "Increase financial support for refugee education, although the funding may still be insufficient to meet all the needs and challenges.",
        advantages: "Provides additional resources and support to enhance the educational opportunities and outcomes for refugee students.",
        disadvantages: "May not fully address the financial needs and complexities associated with providing a comprehensive education for refugees.",
        cost: 2
      },
      {
        id: 3,
        title: "Significant Funding",
        description: "Allocate significant financial resources to ensure adequate funding for refugee education, allowing for comprehensive support and inclusion.",
        advantages: "Enables the provision of high-quality education, resources, and support services for refugee students, maximizing their potential for success.",
        disadvantages: "Requires a substantial financial commitment and potentially reallocating resources from other areas of the budget.",
        cost: 3
      }
    ]
  },
  {
    id: 7,
    name: "Certification/Accreditation",
    options: [
      {
        id: 1,
        title: "Local Recognition Only",
        description: "Only recognize and accredit the educational qualifications and experiences obtained within the Republic of Bean, disregarding previous education obtained in the migrants' countries of origin.",
        advantages: "Simplifies the accreditation process and ensures alignment with national standards, promoting consistency in educational qualifications.",
        disadvantages: "Disregards the educational background and qualifications obtained by migrants, potentially overlooking valuable skills and knowledge, hindering their integration and employment opportunities.",
        cost: 1
      },
      {
        id: 2,
        title: "Universal Standards",
        description: "Establish a comprehensive evaluation and recognition process for the certification and accreditation of previous educational experiences obtained by migrants. Use universal standards for certification and accreditation.",
        advantages: "Recognizes and values the educational achievements and qualifications obtained by migrants, enhancing their opportunities for further education and employment. It helps their educational journey globally.",
        disadvantages: "Requires additional resources, expertise, and time to evaluate and assess the diverse educational backgrounds of migrants, potentially leading to delays in accessing education or employment.",
        cost: 2
      },
      {
        id: 3,
        title: "Tailored Recognition",
        description: "Develop tailored programs and initiatives that combine recognition of previous education with additional training or assessments to ensure alignment with national standards and requirements.",
        advantages: "Provides a pathway for migrants to have their previous education recognized while addressing any gaps or discrepancies through additional training or assessments.",
        disadvantages: "Requires additional resources and coordination to design and implement tailored programs, potentially leading to logistical challenges and variations in educational outcomes.",
        cost: 3
      }
    ]
  }
]; 