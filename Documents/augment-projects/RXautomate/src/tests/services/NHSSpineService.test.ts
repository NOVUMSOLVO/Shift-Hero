import NHSSpineService from '@/services/NHSSpineService';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('NHSSpineService', () => {
  it('fetches patient details by NHS number', async () => {
    const mockResponse = { data: { name: 'John Doe', nhsNumber: '1234567890' } };
    mockedAxios.get.mockResolvedValueOnce(mockResponse);

    const result = await NHSSpineService.getPatientByNhsNumber('1234567890');

    expect(mockedAxios.get).toHaveBeenCalledWith(
      '/nhs/patient/1234567890',
      expect.any(Object)
    );
    expect(result).toEqual(mockResponse.data);
  });

  it('handles errors when fetching patient details', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));

    await expect(NHSSpineService.getPatientByNhsNumber('1234567890')).rejects.toThrow('Network Error');
  });
});